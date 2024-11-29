-- Latest stock prices view
CREATE OR REPLACE VIEW vw_latest_prices AS
WITH RankedPrices AS (
  SELECT 
    "ticker",
    date,
    "adjustedClose"::numeric::float8 as "adjustedClose",
    volume::numeric::float8 as volume,
    ROW_NUMBER() OVER (PARTITION BY "ticker" ORDER BY date DESC) as rn
  FROM public."stock_prices"
  WHERE "adjustedClose" IS NOT NULL
)
SELECT 
  "ticker",
  date,
  "adjustedClose",
  volume
FROM RankedPrices
WHERE rn = 1;

-- Volume analysis view
CREATE OR REPLACE VIEW vw_volume_analysis AS
WITH LatestData AS (
  SELECT 
    "ticker",
    date,
    volume::numeric::float8 as volume,
    "adjustedClose"::numeric::float8 as "adjustedClose",
    AVG(volume::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date 
      ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
    ) as avg_volume,
    ROW_NUMBER() OVER (PARTITION BY "ticker" ORDER BY date DESC) as rn
  FROM public."stock_prices"
  WHERE volume IS NOT NULL AND "adjustedClose" IS NOT NULL
)
SELECT 
  "ticker",
  volume,
  avg_volume,
  SUM(volume * "adjustedClose") OVER w / NULLIF(SUM(volume) OVER w, 0) as vwap
FROM LatestData
WHERE rn = 1
WINDOW w AS (
  PARTITION BY "ticker"
  ORDER BY date DESC
  ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
);

-- Technical analysis view
CREATE OR REPLACE VIEW vw_technical_analysis AS
WITH LatestData AS (
  SELECT 
    "ticker",
    date,
    "adjustedClose"::numeric::float8 as "adjustedClose",
    volume::numeric::float8 as volume,
    LAG("adjustedClose"::numeric::float8, 20) OVER (
      PARTITION BY "ticker" 
      ORDER BY date
    ) as price_20d_ago,
    AVG("adjustedClose"::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as sma20,
    AVG(volume::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as avg_volume,
    ROW_NUMBER() OVER (PARTITION BY "ticker" ORDER BY date DESC) as rn
  FROM public."stock_prices"
  WHERE "adjustedClose" IS NOT NULL AND volume IS NOT NULL
)
SELECT 
  "ticker",
  "adjustedClose" as current_price,
  CASE 
    WHEN price_20d_ago IS NOT NULL THEN
      (("adjustedClose" - price_20d_ago) / NULLIF(price_20d_ago, 0) * 100)::numeric(10,2)
    ELSE NULL
  END as price_change_20d,
  sma20,
  avg_volume
FROM LatestData
WHERE rn = 1;

-- Breakout analysis view
CREATE OR REPLACE VIEW vw_breakout_analysis AS
WITH PriceData AS (
  SELECT 
    "ticker",
    date,
    "adjustedClose"::numeric::float8 as price,
    volume::numeric::float8 as volume,
    -- Calculate moving averages
    AVG("adjustedClose"::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as sma20,
    AVG("adjustedClose"::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 49 PRECEDING AND CURRENT ROW
    ) as sma50,
    -- Calculate volume metrics
    AVG(volume::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as avg_volume_20d,
    -- Calculate price ranges
    MAX("adjustedClose"::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND 1 PRECEDING
    ) as resistance_20d,
    MIN("adjustedClose"::numeric::float8) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND 1 PRECEDING
    ) as support_20d,
    -- Calculate price changes for RSI
    "adjustedClose"::numeric::float8 - LAG("adjustedClose"::numeric::float8, 1) OVER (
      PARTITION BY "ticker"
      ORDER BY date
    ) as price_change,
    ROW_NUMBER() OVER (PARTITION BY "ticker" ORDER BY date DESC) as rn
  FROM public."stock_prices"
  WHERE "adjustedClose" IS NOT NULL AND volume IS NOT NULL
),
RSI_Calc AS (
  SELECT 
    *,
    AVG(CASE WHEN price_change > 0 THEN price_change ELSE 0 END) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 13 PRECEDING AND CURRENT ROW
    ) as avg_gain,
    AVG(CASE WHEN price_change < 0 THEN ABS(price_change) ELSE 0 END) OVER (
      PARTITION BY "ticker"
      ORDER BY date
      ROWS BETWEEN 13 PRECEDING AND CURRENT ROW
    ) as avg_loss
  FROM PriceData
)
SELECT 
  ticker,
  date,
  price as current_price,
  sma20,
  sma50,
  volume,
  avg_volume_20d,
  resistance_20d,
  support_20d,
  -- Calculate RSI
  CASE 
    WHEN avg_loss = 0 THEN 100
    ELSE (100 - (100 / (1 + (avg_gain / NULLIF(avg_loss, 0)))))::numeric(10,2)
  END as rsi,
  -- Breakout indicators
  CASE 
    WHEN price > resistance_20d 
      AND volume > (avg_volume_20d * 1.5) -- Volume surge
      AND sma20 > sma50 -- Moving average confirmation
      AND (resistance_20d - support_20d) / NULLIF(support_20d, 0) < 0.1 -- Recent consolidation
    THEN true 
    ELSE false 
  END as potential_breakout,
  -- Breakout strength score (0-100)
  (
    -- Volume component (0-40 points)
    LEAST(((volume / NULLIF(avg_volume_20d, 0) - 1) * 20)::numeric, 40) +
    -- Price vs resistance component (0-30 points)
    LEAST(((price / NULLIF(resistance_20d, 0) - 1) * 100)::numeric, 30) +
    -- Moving average trend component (0-30 points)
    CASE 
      WHEN sma20 > sma50 THEN 
        LEAST(((sma20 / NULLIF(sma50, 0) - 1) * 100)::numeric, 30)
      ELSE 0 
    END
  )::numeric(10,2) as breakout_strength
FROM RSI_Calc
WHERE rn = 1
  AND price > resistance_20d -- Only show stocks breaking resistance
ORDER BY breakout_strength DESC;
