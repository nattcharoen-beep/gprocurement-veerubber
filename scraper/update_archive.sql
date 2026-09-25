UPDATE announcements SET flow_name = 'ประกาศผู้ชนะการเสนอราคา', winner_name = 'ประกาศผู้ชนะแล้ว (เคาะแล้ว)' WHERE announce_type = 'W0' AND (winner_name IS NULL OR winner_name = '');
UPDATE announcements SET flow_name = 'จัดทำสัญญา/บริหารสัญญา', winner_name = 'จัดทำสัญญาแล้ว (เคาะแล้ว)' WHERE announce_type IN ('W1', 'W2', 'IM') AND (winner_name IS NULL OR winner_name = '');
UPDATE announcements SET winner_price = 5757600, discount_percent = 42.95, flow_name = 'จัดทำสัญญา/บริหารสัญญา', winner_name = 'จัดทำสัญญาแล้ว (เคาะแล้ว ฿5.75M)' WHERE project_id = '69029535267';
