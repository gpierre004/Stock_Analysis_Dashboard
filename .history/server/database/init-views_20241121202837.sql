-- Latest stock prices view
CREATE OR REPLACE VIEW vw_latest_prices AS
WITH RankedPrices AS (
  SELECT 
    "ticker",
    date,
    "adjustedClose"::numeric::float8 as "adjustedClose",
    volume::numeric::float8 as volume,
    ROW_NUMBER() OVER (PARTITION BY "ticker" ORDER BY date DESC) as rn
  FROM public."StockPrices"
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
  FROM public."StockPrices"
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
  FROM public."StockPrices"
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