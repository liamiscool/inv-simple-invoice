-- Seed curated templates for inv

-- Template 1: Minimal Black
INSERT INTO template (id, type, title, description, spec, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'curated',
  'Minimal Black',
  'Clean, minimalist design with stark black typography',
  '{
    "meta": {
      "width": 210,
      "height": 297,
      "dpi": 300,
      "margins": {
        "top": 20,
        "right": 20,
        "bottom": 20,
        "left": 20
      }
    },
    "areas": {
      "invoice_number": {
        "x": 150,
        "y": 20,
        "width": 40,
        "height": 8,
        "type": "text",
        "style": {"fontSize": 10, "fontWeight": "bold"}
      },
      "company_name": {
        "x": 20,
        "y": 20,
        "width": 80,
        "height": 10,
        "type": "text",
        "style": {"fontSize": 16, "fontWeight": "bold"}
      },
      "company_address": {
        "x": 20,
        "y": 35,
        "width": 80,
        "height": 20,
        "type": "text",
        "style": {"fontSize": 9}
      },
      "client_name": {
        "x": 20,
        "y": 70,
        "width": 80,
        "height": 8,
        "type": "text",
        "style": {"fontSize": 10, "fontWeight": "bold"}
      },
      "client_address": {
        "x": 20,
        "y": 80,
        "width": 80,
        "height": 20,
        "type": "text",
        "style": {"fontSize": 9}
      },
      "invoice_date": {
        "x": 150,
        "y": 35,
        "width": 40,
        "height": 6,
        "type": "text",
        "style": {"fontSize": 9}
      },
      "due_date": {
        "x": 150,
        "y": 42,
        "width": 40,
        "height": 6,
        "type": "text",
        "style": {"fontSize": 9}
      },
      "items_table": {
        "x": 20,
        "y": 110,
        "width": 170,
        "height": 120,
        "type": "table",
        "columns": [
          {"key": "description", "label": "Description", "width": 90},
          {"key": "qty", "label": "Qty", "width": 20, "align": "right"},
          {"key": "unitPrice", "label": "Unit Price", "width": 30, "align": "right"},
          {"key": "total", "label": "Total", "width": 30, "align": "right"}
        ]
      },
      "totals_block": {
        "x": 140,
        "y": 235,
        "width": 50,
        "height": 30,
        "type": "totals",
        "style": {"fontSize": 9}
      }
    }
  }'::jsonb,
  true
);

-- Template 2: Terminal Green
INSERT INTO template (id, type, title, description, spec, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'curated',
  'Terminal Green',
  'Monospace terminal aesthetic with green accents',
  '{
    "meta": {
      "width": 210,
      "height": 297,
      "dpi": 300,
      "margins": {
        "top": 15,
        "right": 15,
        "bottom": 15,
        "left": 15
      }
    },
    "areas": {
      "invoice_number": {
        "x": 145,
        "y": 15,
        "width": 50,
        "height": 8,
        "type": "text",
        "style": {"fontSize": 10, "fontFamily": "monospace", "color": "#00ff00"}
      },
      "company_name": {
        "x": 15,
        "y": 15,
        "width": 100,
        "height": 10,
        "type": "text",
        "style": {"fontSize": 14, "fontFamily": "monospace", "fontWeight": "bold"}
      },
      "company_address": {
        "x": 15,
        "y": 28,
        "width": 100,
        "height": 20,
        "type": "text",
        "style": {"fontSize": 8, "fontFamily": "monospace"}
      },
      "client_name": {
        "x": 15,
        "y": 60,
        "width": 90,
        "height": 8,
        "type": "text",
        "style": {"fontSize": 10, "fontFamily": "monospace", "fontWeight": "bold"}
      },
      "client_address": {
        "x": 15,
        "y": 70,
        "width": 90,
        "height": 20,
        "type": "text",
        "style": {"fontSize": 8, "fontFamily": "monospace"}
      },
      "invoice_date": {
        "x": 145,
        "y": 28,
        "width": 50,
        "height": 6,
        "type": "text",
        "style": {"fontSize": 8, "fontFamily": "monospace"}
      },
      "due_date": {
        "x": 145,
        "y": 36,
        "width": 50,
        "height": 6,
        "type": "text",
        "style": {"fontSize": 8, "fontFamily": "monospace"}
      },
      "items_table": {
        "x": 15,
        "y": 100,
        "width": 180,
        "height": 130,
        "type": "table",
        "columns": [
          {"key": "description", "label": "ITEM", "width": 100},
          {"key": "qty", "label": "QTY", "width": 20, "align": "right"},
          {"key": "unitPrice", "label": "PRICE", "width": 30, "align": "right"},
          {"key": "total", "label": "TOTAL", "width": 30, "align": "right"}
        ],
        "style": {"fontFamily": "monospace", "fontSize": 8}
      },
      "totals_block": {
        "x": 145,
        "y": 240,
        "width": 50,
        "height": 30,
        "type": "totals",
        "style": {"fontSize": 9, "fontFamily": "monospace"}
      }
    }
  }'::jsonb,
  true
);

-- Template 3: Swiss Grid
INSERT INTO template (id, type, title, description, spec, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'curated',
  'Swiss Grid',
  'Helvetica-inspired grid system with precise alignment',
  '{
    "meta": {
      "width": 210,
      "height": 297,
      "dpi": 300,
      "margins": {
        "top": 25,
        "right": 25,
        "bottom": 25,
        "left": 25
      }
    },
    "areas": {
      "invoice_number": {
        "x": 135,
        "y": 25,
        "width": 50,
        "height": 8,
        "type": "text",
        "style": {"fontSize": 11, "fontWeight": "bold"}
      },
      "company_name": {
        "x": 25,
        "y": 25,
        "width": 85,
        "height": 12,
        "type": "text",
        "style": {"fontSize": 18, "fontWeight": "300"}
      },
      "company_address": {
        "x": 25,
        "y": 40,
        "width": 85,
        "height": 25,
        "type": "text",
        "style": {"fontSize": 9, "lineHeight": 1.4}
      },
      "client_name": {
        "x": 25,
        "y": 80,
        "width": 85,
        "height": 8,
        "type": "text",
        "style": {"fontSize": 10, "fontWeight": "600"}
      },
      "client_address": {
        "x": 25,
        "y": 90,
        "width": 85,
        "height": 25,
        "type": "text",
        "style": {"fontSize": 9, "lineHeight": 1.4}
      },
      "invoice_date": {
        "x": 135,
        "y": 40,
        "width": 50,
        "height": 6,
        "type": "text",
        "style": {"fontSize": 9}
      },
      "due_date": {
        "x": 135,
        "y": 48,
        "width": 50,
        "height": 6,
        "type": "text",
        "style": {"fontSize": 9}
      },
      "items_table": {
        "x": 25,
        "y": 125,
        "width": 160,
        "height": 110,
        "type": "table",
        "columns": [
          {"key": "description", "label": "Description", "width": 85},
          {"key": "qty", "label": "Qty", "width": 20, "align": "right"},
          {"key": "unitPrice", "label": "Rate", "width": 27.5, "align": "right"},
          {"key": "total", "label": "Amount", "width": 27.5, "align": "right"}
        ]
      },
      "totals_block": {
        "x": 135,
        "y": 240,
        "width": 50,
        "height": 30,
        "type": "totals",
        "style": {"fontSize": 9}
      }
    }
  }'::jsonb,
  true
);
