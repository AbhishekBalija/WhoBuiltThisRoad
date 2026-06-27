import os
import json
import re
from datetime import date
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _parse_date(value):
    if not value or not isinstance(value, str) or not DATE_RE.match(value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _parse_float(value):
    if not value or not isinstance(value, str):
        return None
    cleaned = value.strip().lower().replace("km", "").strip()
    try:
        v = float(cleaned)
        if v > 100 or v < 0:
            return None
        return v
    except (ValueError, TypeError):
        return None


def load_records(records, source_document="dlp_east_2017.pdf", source_label="DLP East 2017"):
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = False
    cur = conn.cursor()

    roads_inserted = 0
    work_orders_inserted = 0
    errors = []

    try:
        for rec in records:
            slug = rec["slug"]
            name = rec["road_name"]
            description = rec.get("road_name_display") or rec["road_name"]
            division = rec["division"]
            length_km = _parse_float(rec.get("length_km"))

            cur.execute(
                """
                INSERT INTO roads (slug, name, description, division, length_km)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    division = EXCLUDED.division,
                    length_km = COALESCE(EXCLUDED.length_km, roads.length_km)
                RETURNING id
                """,
                (slug, name, description, division, length_km),
            )
            road_id = cur.fetchone()[0]
            roads_inserted += 1

            serial_no = rec.get("serial_no")
            contractor_name = rec.get("contractor_name")
            contractor_phone = rec.get("contractor_phone")
            ae_name = rec.get("ae_name")
            ae_phone = rec.get("ae_phone")
            completion_date = _parse_date(rec.get("completion_date"))
            dlp_period_years = _parse_float(rec.get("dlp_period_years"))
            dlp_expiry_date = _parse_date(rec.get("dlp_expiry_date"))

            cur.execute(
                """
                INSERT INTO work_orders
                    (road_id, serial_no, contractor_name, contractor_phone,
                     ae_name, ae_phone, completion_date, dlp_period_years,
                     dlp_expiry_date, source_document, source_label)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (road_id, source_document) DO NOTHING
                """,
                (
                    road_id,
                    serial_no,
                    contractor_name,
                    contractor_phone,
                    ae_name,
                    ae_phone,
                    completion_date,
                    dlp_period_years,
                    dlp_expiry_date,
                    source_document,
                    source_label,
                ),
            )
            work_orders_inserted += 1

        conn.commit()
    except Exception as e:
        conn.rollback()
        errors.append(str(e))
        raise
    finally:
        cur.close()
        conn.close()

    return {
        "roads_inserted": roads_inserted,
        "work_orders_inserted": work_orders_inserted,
        "errors": errors,
    }


def main():
    import sys

    source = sys.argv[1] if len(sys.argv) > 1 else "../data/processed/parsed_normalized.json"
    with open(source) as f:
        records = json.load(f)

    print(f"Loading {len(records)} records from {source}...")
    result = load_records(records)
    print(f"Done: {result['roads_inserted']} roads, {result['work_orders_inserted']} work orders")
    if result["errors"]:
        print(f"Errors: {result['errors']}")


if __name__ == "__main__":
    main()
