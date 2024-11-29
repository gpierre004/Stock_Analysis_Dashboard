-- Latest stock prices view
ALTER VIEW vw_latest_prices AS
WITH RankedPrices AS (
  SELECT 
    ticker,
    date,
    CAST(adjustedClose AS float) as adjustedClose,
    CAST(volume AS float) as volume,
    ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY date DESC) as rn
  FROM public.stock_prices
  WHERE adjustedClose IS NOT NULL
)
SELECT 
  ticker,
  date,
  adjustedClose,
  volume
FROM RankedPrices
WHERE rn = 1;

-- Volume analysis view
ALTER VIEW vw_volume_analysis AS
WITH LatestData AS (
  SELECT 
    ticker,
    date,
    CAST(volume AS float) as volume,
    CAST(adjustedClose AS float) as adjustedClose,
    AVG(CAST(volume AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date 
      ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
    ) as avg_volume,
    ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY date DESC) as rn
  FROM public.stock_prices
  WHERE volume IS NOT NULL AND adjustedClose IS NOT NULL
)
SELECT 
  ticker,
  volume,
  avg_volume,
  SUM(volume * adjustedClose) OVER w / NULLIF(SUM(volume) OVER w, 0) as vwap
FROM LatestData
WHERE rn = 1
WINDOW w AS (
  PARTITION BY ticker
  ORDER BY date DESC
  ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
);

-- Technical analysis view
ALTER VIEW vw_technical_analysis AS
WITH LatestData AS (
  SELECT 
    ticker,
    date,
    CAST(adjustedClose AS float) as adjustedClose,
    CAST(volume AS float) as volume,
    LAG(CAST(adjustedClose AS float), 20) OVER (
      PARTITION BY ticker 
      ORDER BY date
    ) as price_20d_ago,
    AVG(CAST(adjustedClose AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as sma20,
    AVG(CAST(volume AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as avg_volume,
    ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY date DESC) as rn
  FROM public.stock_prices
  WHERE adjustedClose IS NOT NULL AND volume IS NOT NULL
)
SELECT 
  ticker,
  adjustedClose as current_price,
  CASE 
    WHEN price_20d_ago IS NOT NULL THEN
      CAST(((adjustedClose - price_20d_ago) / NULLIF(price_20d_ago, 0) * 100) AS decimal(10,2))
    ELSE NULL
  END as price_change_20d,
  sma20,
  avg_volume
FROM LatestData
WHERE rn = 1;

-- Breakout analysis view
ALTER VIEW vw_breakout_analysis AS
WITH PriceData AS (
  SELECT 
    ticker,
    date,
    CAST(adjustedClose AS float) as price,
    CAST(volume AS float) as volume,
    -- Calculate moving averages
    AVG(CAST(adjustedClose AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as sma20,
    AVG(CAST(adjustedClose AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 49 PRECEDING AND CURRENT ROW
    ) as sma50,
    -- Calculate volume metrics
    AVG(CAST(volume AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) as avg_volume_20d,
    -- Calculate price ranges
    MAX(CAST(adjustedClose AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND 1 PRECEDING
    ) as resistance_20d,
    MIN(CAST(adjustedClose AS float)) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 19 PRECEDING AND 1 PRECEDING
    ) as support_20d,
    -- Calculate price changes for RSI
    CAST(adjustedClose AS float) - LAG(CAST(adjustedClose AS float), 1) OVER (
      PARTITION BY ticker
      ORDER BY date
    ) as price_change,
    ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY date DESC) as rn
  FROM public.stock_prices
  WHERE adjustedClose IS NOT NULL AND volume IS NOT NULL
),
RSI_Calc AS (
  SELECT 
    *,
    AVG(CASE WHEN price_change > 0 THEN price_change ELSE 0 END) OVER (
      PARTITION BY ticker
      ORDER BY date
      ROWS BETWEEN 13 PRECEDING AND CURRENT ROW
    ) as avg_gain,
    AVG(CASE WHEN price_change < 0 THEN ABS(price_change) ELSE 0 END) OVER (
      PARTITION BY ticker
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
  CAST(CASE 
    WHEN avg_loss = 0 THEN 100
    ELSE (100 - (100 / (1 + (avg_gain / NULLIF(avg_loss, 0)))))
  END AS decimal(10,2)) as rsi,
  -- Breakout indicators
  CASE 
    WHEN price > resistance_20d 
      AND volume > (avg_volume_20d * 1.5) -- Volume surge
      AND sma20 > sma50 -- Moving average confirmation
      AND (resistance_20d - support_20d) / NULLIF(support_20d, 0) < 0.1 -- Recent consolidation
    THEN 1 
    ELSE 0 
  END as potential_breakout,
  -- Breakout strength score (0-100)
  CAST((
    -- Volume component (0-40 points)
    (SELECT MIN(v) FROM (VALUES 
      (((volume / NULLIF(avg_volume_20d, 0) - 1) * 20), 40.0)
    ) AS value(v)) +
    -- Price vs resistance component (0-30 points)
    (SELECT MIN(v) FROM (VALUES 
      (((price / NULLIF(resistance_20d, 0) - 1) * 100), 30.0)
    ) AS value(v)) +
    -- Moving average trend component (0-30 points)
    CASE 
      WHEN sma20 > sma50 THEN 
        (SELECT MIN(v) FROM (VALUES 
          (((sma20 / NULLIF(sma50, 0) - 1) * 100), 30.0)
        ) AS value(v))
      ELSE 0 
    END
  ) AS decimal(10,2)) as breakout_strength
FROM RSI_Calc
WHERE rn = 1
  AND price > resistance_20d -- Only show stocks breaking resistance
ORDER BY breakout_strength DESC;
