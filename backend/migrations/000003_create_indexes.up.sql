CREATE INDEX roads_name_trgm_idx ON roads USING GIN (name gin_trgm_ops);
CREATE INDEX roads_description_trgm_idx ON roads USING GIN (description gin_trgm_ops);
CREATE INDEX wo_contractor_trgm_idx ON work_orders USING GIN (contractor_name gin_trgm_ops);
CREATE INDEX wo_road_id_idx ON work_orders (road_id);
CREATE INDEX wo_dlp_expiry_idx ON work_orders (dlp_expiry_date);
