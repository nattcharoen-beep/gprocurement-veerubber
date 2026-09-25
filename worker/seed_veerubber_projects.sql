-- Seed Realistic Vee Rubber Tire Government Procurement Announcements into D1
-- Fiscal Year 2569 (Active Unbid) & 2568 (Archive Winners)

-- 1. Passenger Car, Pickup & Van Tires (ยางรถยนต์, กระบะ, รถตู้ราชการ)
INSERT OR REPLACE INTO announcements (
    id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, boq_summary, doc_verified
) VALUES 
(
    '69010010001-D0', '69010010001', 'ประกวดราคาซื้อยางรถยนต์ส่วนกลางและรถตรวจการณ์ ประจำปีงบประมาณ พ.ศ. 2569 กรมการขนส่งทางบก',
    'D0', datetime('now', '-2 days'), 1850000, 'กรมการขนส่งทางบก', 'กรุงเทพมหานคร', 'passenger_car_tires',
    'https://process.gprocurement.go.th', 'ยางเรเดียล 215/60R16 จำนวน 80 เส้น, 265/65R17 จำนวน 60 เส้น พร้อมบริการเปลี่ยนและถ่วงล้อ', 1
),
(
    '69010010002-B0', '69010010002', 'จ้างเปลี่ยนยางรถตู้พยาบาลฉุกเฉินและรถกู้ชีพพร้อมบริการตั้งศูนย์ถ่วงล้อ โรงพยาบาลศูนย์ขอนแก่น',
    'B0', datetime('now', '-4 days'), 720000, 'โรงพยาบาลศูนย์ขอนแก่น', 'ขอนแก่น', 'passenger_car_tires',
    'https://process.gprocurement.go.th', 'ยางรถตู้พยาบาล 195R15C Extra Load จำนวน 48 เส้น', 1
),
(
    '69010010003-15', '69010010003', 'ราคากลางจัดซื้อยางรถยนต์กระบะ 4 ประตูสายตรวจ กองบังคับการตำรวจภูธรจังหวัดเชียงใหม่',
    '15', datetime('now', '-1 days'), 640000, 'ตำรวจภูธรจังหวัดเชียงใหม่', 'เชียงใหม่', 'passenger_car_tires',
    'https://process.gprocurement.go.th', 'ยางเรเดียลกระบะ 245/70R16 AT จำนวน 40 เส้น', 1
),
(
    '69010010004-P0', '69010010004', 'แผนการจัดซื้อจัดจ้างยางรถยนต์ราชการส่วนกลาง ประจำไตรมาส 3 สำนักงานปลัดกระทรวงสาธารณสุข',
    'P0', datetime('now', '-5 days'), 1200000, 'สำนักงานปลัดกระทรวงสาธารณสุข', 'นนทบุรี', 'passenger_car_tires',
    'https://process.gprocurement.go.th', NULL, 0
);

-- 2. Truck, Bus & Commercial Tires (ยางรถบรรทุก, รถบัส, ดับเพลิง, ขยะ)
INSERT OR REPLACE INTO announcements (
    id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, boq_summary, doc_verified
) VALUES 
(
    '69010020001-D0', '69010020001', 'ประกวดราคาซื้อยางรถบรรทุกน้ำดับเพลิงและยางรถบรรทุก 10 ล้อ เทศบาลนครนนทบุรี',
    'D0', datetime('now', '-1 days'), 3450000, 'เทศบาลนครนนทบุรี', 'นนทบุรี', 'truck_bus_tires',
    'https://process.gprocurement.go.th', 'ยางรถบรรทุก 11R22.5 TBR พร้อมยางในและยางรอง จำนวน 120 เส้น', 1
),
(
    '69010020002-B0', '69010020002', 'จัดซื้อยางเรเดียลรถโดยสารปรับอากาศ NGV (TBR 295/80R22.5) องค์การขนส่งมวลชนกรุงเทพ (ขสมก.)',
    'B0', datetime('now', '-3 days'), 8900000, 'องค์การขนส่งมวลชนกรุงเทพ', 'กรุงเทพมหานคร', 'truck_bus_tires',
    'https://process.gprocurement.go.th', 'ยางเรเดียลรถโดยสาร 295/80R22.5 จำนวน 450 เส้น มอก. 2718-2560', 1
),
(
    '69010020003-P0', '69010020003', 'แผนจัดซื้อจัดจ้างยางรถบรรทุกขยะและรถสุขาภิบาล ประจำปีงบประมาณ 2569 องค์การบริหารส่วนจังหวัดชลบุรี',
    'P0', datetime('now', '-6 days'), 2800000, 'องค์การบริหารส่วนจังหวัดชลบุรี', 'ชลบุรี', 'truck_bus_tires',
    'https://process.gprocurement.go.th', NULL, 0
),
(
    '69010020004-D0', '69010020004', 'ซื้อยางรถบรรทุก 6 ล้อ และรถบรรทุกเทท้าย พร้อมอุปกรณ์เปลี่ยนยาง เทศบาลเมืองหัวหิน',
    'D0', datetime('now', '-2 days'), 1150000, 'เทศบาลเมืองหัวหิน', 'ประจวบคีรีขันธ์', 'truck_bus_tires',
    'https://process.gprocurement.go.th', 'ยางผ้าใบ 8.25-16 14PR จำนวน 50 เส้น', 1
);

-- 3. Motorcycle & Patrol Tires (ยางรถจักรยานยนต์ราชการและสายตรวจ)
INSERT OR REPLACE INTO announcements (
    id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, boq_summary, doc_verified
) VALUES 
(
    '69010030001-D0', '69010030001', 'ประกวดราคาซื้อยางนอกและยางในรถจักรยานยนต์สายตรวจ กองบัญชาการตำรวจนครบาล',
    'D0', datetime('now', '-3 days'), 1250000, 'กองบัญชาการตำรวจนครบาล', 'กรุงเทพมหานคร', 'motorcycle_tires',
    'https://process.gprocurement.go.th', 'ยางนอก 70/90-17, 80/90-17 พร้อมยางในบิวทิล จำนวน 1,200 ชุด', 1
),
(
    '69010030002-15', '69010030002', 'ราคากลางซื้อยางรถจักรยานยนต์ตรวจการณ์เทศกิจและกู้ชีพ เทศบาลนครหาดใหญ่',
    '15', datetime('now', '-2 days'), 420000, 'เทศบาลนครหาดใหญ่', 'สงขลา', 'motorcycle_tires',
    'https://process.gprocurement.go.th', 'ยางสกู๊ตเตอร์ 110/70-12, 120/70-12 จำนวน 200 เส้น', 1
),
(
    '69010030003-B0', '69010030003', 'จ้างเปลี่ยนยางนอกและยางในรถจักรยานยนต์ส่งสารและสายตรวจ อบจ.นครราชสีมา',
    'B0', datetime('now', '-5 days'), 380000, 'องค์การบริหารส่วนจังหวัดนครราชสีมา', 'นครราชสีมา', 'motorcycle_tires',
    'https://process.gprocurement.go.th', 'ยางนอกและยางใน 2.50-17, 2.75-17', 0
);

-- 4. OTR, Heavy Machinery, Tractor & Agr (ยาง OTR, รถแทรกเตอร์, รถตัก, รถยกโฟล์คลิฟท์)
INSERT OR REPLACE INTO announcements (
    id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, boq_summary, doc_verified
) VALUES 
(
    '69010040001-D0', '69010040001', 'ประกวดราคาซื้อยางรถตักล้อยาง (Wheel Loader) และยางรถเกลี่ยดิน กรมทางหลวงชนบท',
    'D0', datetime('now', '-1 days'), 4200000, 'กรมทางหลวงชนบท', 'ปทุมธานี', 'otr_heavy_machinery',
    'https://process.gprocurement.go.th', 'ยาง OTR ขนาด 17.5-25 16PR จำนวน 32 เส้น, 14.00-24 จำนวน 24 เส้น', 1
),
(
    '69010040002-B0', '69010040002', 'จัดซื้อยางรถแทรกเตอร์เพื่อการเกษตรและเครื่องจักรกลฟาร์ม กรมพัฒนาที่ดิน',
    'B0', datetime('now', '-4 days'), 1650000, 'กรมพัฒนาที่ดิน', 'นครราชสีมา', 'otr_heavy_machinery',
    'https://process.gprocurement.go.th', 'ยางฟาร์มแทรกเตอร์ 16.9-28, 18.4-30 ดอกก้างปลา', 1
),
(
    '69010040003-15', '69010040003', 'ราคากลางจัดซื้อยางตันรถยกโฟล์คลิฟท์ (Solid Forklift Tires) ท่าเรือกรุงเทพ การท่าเรือแห่งประเทศไทย',
    '15', datetime('now', '-3 days'), 1950000, 'การท่าเรือแห่งประเทศไทย', 'กรุงเทพมหานคร', 'otr_heavy_machinery',
    'https://process.gprocurement.go.th', 'ยางตันรถยก 28x9-15, 6.00-9, 7.00-12 จำนวน 180 เส้น', 1
);

-- 5. Bicycle, Specialty & Wheelchair Tires (ยางจักรยาน, วีลแชร์, รถกอล์ฟ, ATV)
INSERT OR REPLACE INTO announcements (
    id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, boq_summary, doc_verified
) VALUES 
(
    '69010050001-D0', '69010050001', 'ประกวดราคาซื้อยางนอก-ยางในรถเข็นคนพิการ (Wheelchair) และยางรถเข็นผู้ป่วย กรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ',
    'D0', datetime('now', '-2 days'), 980000, 'กรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ', 'กรุงเทพมหานคร', 'bicycle_specialty_tires',
    'https://process.gprocurement.go.th', 'ยางรถวีลแชร์สีเทา Non-marking 24x1-3/8 พร้อมยางในบิวทิล 800 เส้น', 1
),
(
    '69010050002-B0', '69010050002', 'ซื้อยางรถกอล์ฟไฟฟ้าและยางรถตัดหญ้าเพื่อการดูแลรักษาลานกีฬา ศูนย์พัฒนากีฬากองทัพอากาศ',
    'B0', datetime('now', '-5 days'), 560000, 'กองทัพอากาศ', 'กรุงเทพมหานคร', 'bicycle_specialty_tires',
    'https://process.gprocurement.go.th', 'ยางรถกอล์ฟ 18x8.50-8 4PR จำนวน 120 เส้น', 1
);

-- 6. Tube & Wheel Accessories (ยางใน, ยางรองคอด, จุ๊บลม)
INSERT OR REPLACE INTO announcements (
    id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, boq_summary, doc_verified
) VALUES 
(
    '69010060001-D0', '69010060001', 'จัดซื้อยางในบิวทิล ยางรองคอดกะทะล้อ และจุ๊บลมสำหรับยานพาหนะทหาร กรมสรรพาวุธทหารบก',
    'D0', datetime('now', '-3 days'), 2100000, 'กรมสรรพาวุธทหารบก', 'กรุงเทพมหานคร', 'tube_accessories',
    'https://process.gprocurement.go.th', 'ยางในบิวทิล 11.00-20, ยางรองคอด 20 นิ้ว และจุ๊บทองเหลือง', 1
);

-- 7. Archive / Completed Projects with Winners (คลังเคาะแล้ว / สถิติราคาและคู่แข่ง)
INSERT OR REPLACE INTO announcements (
    id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
    winner_name, winner_price, winner_tax_id, discount_percent
) VALUES 
(
    '68090010001-W0', '68090010001', 'ประกวดราคาซื้อยางรถยนต์บรรทุกขนาด 10 ล้อ พร้อมยางในและยางรอง เทศบาลนครเชียงใหม่',
    'W0', datetime('now', '-25 days'), 2200000, 'เทศบาลนครเชียงใหม่', 'เชียงใหม่', 'truck_bus_tires', 'https://process.gprocurement.go.th',
    'ห้างหุ้นส่วนจำกัด เชียงใหม่ยางยนต์', 1980000, '0503554001234', 10.00
),
(
    '68090020002-W0', '68090020002', 'จัดซื้อยางรถยนต์ราชการส่วนกลางพร้อมเปลี่ยนถ่วงล้อ องค์การบริหารส่วนจังหวัดระยอง',
    'W0', datetime('now', '-32 days'), 1450000, 'องค์การบริหารส่วนจังหวัดระยอง', 'ระยอง', 'passenger_car_tires', 'https://process.gprocurement.go.th',
    'บริษัท ระยอง ออโต้ไทร์ เซอร์วิส จำกัด', 1320000, '0215558005678', 8.97
),
(
    '68090030003-W0', '68090030003', 'ซื้อยางรถจักรยานยนต์สายตรวจและอุปกรณ์เปลี่ยนถ่วงล้อ ตำรวจภูธรภาค 4',
    'W0', datetime('now', '-40 days'), 890000, 'ตำรวจภูธรภาค 4', 'ขอนแก่น', 'motorcycle_tires', 'https://process.gprocurement.go.th',
    'บริษัท ขอนแก่น โมโตไทร์ จำกัด', 810000, '0405553009988', 8.99
),
(
    '68090040004-W0', '68090040004', 'ประกวดราคาซื้อยางรถตักล้อยางและเครื่องจักรกลงานทาง แขวงทางหลวงสงขลาที่ 1',
    'W0', datetime('now', '-45 days'), 3800000, 'แขวงทางหลวงสงขลาที่ 1', 'สงขลา', 'otr_heavy_machinery', 'https://process.gprocurement.go.th',
    'ห้างหุ้นส่วนจำกัด สงขลาแมชชีนเนอรี่', 3450000, '0903551004321', 9.21
);
