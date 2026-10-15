-- Fold the Positions column's sums for the window on screen into
-- prompt_visibility_summaries (PROMPT-007, the follow-up to #1017).
--
-- The Tracked Prompts page read the same prompt_results rows twice for that
-- window: here for the health columns, and in prompt_position_summaries
-- (00123) for the Positions column. This also returns the per-platform
-- position sums, as one `platforms` array per prompt, so the window is
-- scanned once. prompt_position_summaries stays for the previous period the
-- trend compares against.
--
-- Rows are grouped by prompt and platform first, then rolled up per prompt
-- from sums and counts, so every existing column keeps its value: each
-- average is the same sum over the same count that AVG took.
--
-- The return type changes, so the function is dropped and recreated, as in
-- 00072. PostgREST passes arguments by name, so the running app and the
-- server's callers (signals, pulse) bind to the new function unchanged and
-- ignore the added column.
DROP FUNCTION IF EXISTS public.prompt_visibility_summaries(uuid, timestamptz, timestamptz, text);

CREATE FUNCTION public.prompt_visibility_summaries(
  p_brand_id  uuid,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to   timestamptz DEFAULT NULL,
  p_region    text DEFAULT NULL
)
RETURNS TABLE (
  prompt_id              uuid,
  avg_visibility         double precision,
  avg_visibility_visible double precision,
  total_mentions         bigint,
  total_citations        bigint,
  runs                   bigint,
  visible_runs           bigint,
  mention_answers        bigint,
  citation_answers       bigint,
  position_factor        double precision,
  last_run_at            timestamptz,
  -- One object per platform with prompt_position_summaries' columns:
  -- platform, runs, mention_answers, position_sum, position_count,
  -- entity_sum, entity_count.
  platforms              jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH per_platform AS (
    SELECT pr.prompt_id,
           pr.platform,
           SUM(COALESCE(pr.visibility_score, 0))                   AS visibility_sum,
           SUM(COALESCE(pr.visibility_score, 0))
             FILTER (WHERE pr.mention_count > 0 OR pr.citation_count > 0)
                                                                   AS visibility_visible_sum,
           COALESCE(SUM(pr.mention_count), 0)                      AS total_mentions,
           COALESCE(SUM(pr.citation_count), 0)                     AS total_citations,
           COUNT(*)                                                AS runs,
           COUNT(*) FILTER (WHERE pr.mention_count > 0 OR pr.citation_count > 0)
                                                                   AS visible_runs,
           COUNT(*) FILTER (WHERE pr.mention_count > 0)            AS mention_answers,
           COUNT(*) FILTER (WHERE pr.citation_count > 0)           AS citation_answers,
           SUM(1.0 / pr.mention_position)
             FILTER (WHERE pr.mention_position IS NOT NULL)        AS position_factor_sum,
           COUNT(*) FILTER (WHERE pr.mention_position IS NOT NULL) AS position_factor_count,
           -- The Positions column's sums, exactly as 00123 computes them.
           COALESCE(SUM(pr.mention_position) FILTER (
             WHERE pr.mention_count > 0 AND pr.mention_position > 0), 0)
                                                                   AS position_sum,
           COUNT(*) FILTER (
             WHERE pr.mention_count > 0 AND pr.mention_position > 0) AS position_count,
           COALESCE(SUM(pr.mentioned_entity_count) FILTER (
             WHERE pr.mention_count > 0 AND pr.mention_position > 0
               AND pr.mentioned_entity_count > 0), 0)              AS entity_sum,
           COUNT(*) FILTER (
             WHERE pr.mention_count > 0 AND pr.mention_position > 0
               AND pr.mentioned_entity_count > 0)                  AS entity_count,
           MAX(pr.created_at)                                      AS last_run_at
    FROM public.prompt_results pr
    WHERE pr.brand_id = p_brand_id
      AND pr.prompt_id IS NOT NULL
      AND pr.platform <> 'chatgpt-shopping'  -- #155 - isolate from analytics
      AND (p_date_from IS NULL OR pr.created_at >= p_date_from)
      AND (p_date_to   IS NULL OR pr.created_at <= p_date_to)
      AND (p_region    IS NULL OR pr.region = p_region)
    GROUP BY pr.prompt_id, pr.platform
  )
  SELECT pp.prompt_id,
         (SUM(pp.visibility_sum) / SUM(pp.runs))::double precision AS avg_visibility,
         (SUM(pp.visibility_visible_sum) / NULLIF(SUM(pp.visible_runs), 0))::double precision
                                                                   AS avg_visibility_visible,
         SUM(pp.total_mentions)::bigint                            AS total_mentions,
         SUM(pp.total_citations)::bigint                           AS total_citations,
         SUM(pp.runs)::bigint                                      AS runs,
         SUM(pp.visible_runs)::bigint                              AS visible_runs,
         SUM(pp.mention_answers)::bigint                           AS mention_answers,
         SUM(pp.citation_answers)::bigint                          AS citation_answers,
         (SUM(pp.position_factor_sum) / NULLIF(SUM(pp.position_factor_count), 0))::double precision
                                                                   AS position_factor,
         MAX(pp.last_run_at)                                       AS last_run_at,
         jsonb_agg(
           jsonb_build_object(
             'platform',        pp.platform,
             'runs',            pp.runs,
             'mention_answers', pp.mention_answers,
             'position_sum',    pp.position_sum,
             'position_count',  pp.position_count,
             'entity_sum',      pp.entity_sum,
             'entity_count',    pp.entity_count
           ) ORDER BY pp.platform
         )                                                         AS platforms
  FROM per_platform pp
  GROUP BY pp.prompt_id
$$;

GRANT EXECUTE ON FUNCTION
  public.prompt_visibility_summaries(uuid, timestamptz, timestamptz, text)
  TO authenticated;

COMMENT ON FUNCTION
  public.prompt_visibility_summaries(uuid, timestamptz, timestamptz, text) IS
  'Per-prompt visibility/mention aggregates for the All Prompts table, plus per-platform position sums for its Positions column (00146). p_region scopes to one tracked location (#691); NULL blends every location, as before.';
