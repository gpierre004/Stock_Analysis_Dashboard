-- Find strong breakout candidates with good momentum
SELECT 
    ticker,
    current_price,
    CAST(((current_price / resistance_20d - 1) * 100) AS decimal(10,2)) as price_above_resistance_pct,
    CAST((volume / avg_volume_20d) AS decimal(10,2)) as volume_surge_ratio,
    rsi,
    breakout_strength
FROM vw_breakout_analysis
WHERE potential_breakout = 1
    AND rsi >= 50  -- Momentum confirmation
    AND rsi <= 70  -- Not overbought
    AND breakout_strength >= 50  -- Strong breakout signals
ORDER BY breakout_strength DESC;
