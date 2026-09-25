-- Clear all mock sample data (IDs shorter than 11 digits)
DELETE FROM announcements WHERE length(project_id) < 11;

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68069386377-D0', '68069386377', 'ประกวดราคาซื้อยางนอก - ยางใน ชนิดและขนาดต่าง ๆ จำนวน 5 รายการ กองสรรพาวุธทหารบก ด้วยวิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)', 'D0', '2025-06-18', 14995100,
      'กองสรรพาวุธทหารบก', 'กรุงเทพมหานคร', 'tube_accessories', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX19sYIdN4AdAVJHAjSuyIl4RZEImL6E1yI87xSMlGFWnLFrBawkrqAyk',
      NULL, NULL, NULL, NULL, 'ยางนอกและยางในสำหรับยานพาหนะทหาร 5 รายการ พร้อมอุปกรณ์ประกอบ', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68089039865-D0', '68089039865', 'โครงการซื้อยางรถบรรทุกน้ำเอนกประสงค์ องค์การบริหารส่วนตำบลสะอาดสมบูรณ์', 'D0', '2025-08-14', 85000,
      'องค์การบริหารส่วนตำบลสะอาดสมบูรณ์', 'ร้อยเอ็ด', 'truck_bus_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2FDGe9BkDx1ng5SdNbIYpRbC9bSyiYP%2BLhxjx%2FNjxfIdazSMH0DfEG7',
      NULL, NULL, NULL, NULL, 'ยางรถบรรทุก 10 ล้อ และ 6 ล้อ สำหรับรถบรรทุกน้ำเอนกประสงค์', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68109597248-D0', '68109597248', 'จัดซื้อยางรถยนต์รถบรรทุกขยะ ทะเบียน 86-1890 สบ. องค์การบริหารส่วนตำบลโคกแย้', 'D0', '2025-10-15', 72000,
      'องค์การบริหารส่วนตำบลโคกแย้', 'สระบุรี', 'truck_bus_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX19kw0hwKT0uYWETiS%2BosaHNQ7SdeeI1Xf%2F%2FOSHzVaUoBoBahEcidhSo',
      NULL, NULL, NULL, NULL, 'ยางรถบรรทุกขยะขนาดใหญ่ พร้อมบริการเปลี่ยนและถ่วงล้อ', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68089132071-D0', '68089132071', 'โครงการซื้อยางรถบรรทุกขยะ จำนวน ๑ รายการ เทศบาลตำบลบางตะบูน', 'D0', '2025-08-20', 73200,
      'เทศบาลตำบลบางตะบูน', 'เพชรบุรี', 'truck_bus_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX181l8QQYwp3d5xGza1q64iYMXjff2E1gCYniWntP10dSNh686c2eoC6',
      NULL, NULL, NULL, NULL, 'ยางรถบรรทุกขยะ 6 ล้อ พร้อมยางในและยางรองคอด', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68109101716-15', '68109101716', 'โครงการซื้อยางรถยนต์ของรถบรรทุกขยะ หมายเลขทะเบียน 80-7593 พัทลุง เทศบาลตำบลจองถนน', '15', '2025-10-07', 65000,
      'เทศบาลตำบลจองถนน', 'พัทลุง', 'truck_bus_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX18PiGqHM6mOtPFtAFu2jd%2F0PrFwEbcEdJcOgssCWU0ONwXvS7IeCYsO',
      NULL, NULL, NULL, NULL, 'ยางรถยนต์สำหรับรถบรรทุกขยะเทศบาล', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68059011358-D0', '68059011358', 'โครงการซื้อยางรถยนต์จำนวน 8 เส้น สำนักเครื่องกลและสื่อสาร กรมทางหลวง', 'D0', '2025-05-12', 145000,
      'กรมทางหลวง', 'กรุงเทพมหานคร', 'passenger_car_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX19ic6r8dFQZsbE55IdRxIOWUqBdF7S1%2Fq%2FgGEEZPmkr2WYk%2Fu0Zgme4',
      NULL, NULL, NULL, NULL, 'ยางรถยนต์เรเดียลสำหรับรถตรวจการณ์และส่วนกลาง', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68049420498-15', '68049420498', 'จัดซื้อยางรถยนต์ส่วนกลาง หมายเลขทะเบียน กง 6846 ลำปาง องค์การบริหารส่วนตำบลใหม่พัฒนา', '15', '2025-04-19', 38000,
      'องค์การบริหารส่วนตำบลใหม่พัฒนา', 'ลำปาง', 'passenger_car_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2Fhnm8e84HsSi2AKw5bJAuJ6%2BpdgLbm%2B5B%2Bt9Bpqf4I6r%2Fp5rYzTPRg',
      NULL, NULL, NULL, NULL, 'ยางรถยนต์กระบะ 4 ประตูส่วนกลาง พร้อมตั้งศูนย์ถ่วงล้อ', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68059075382-15', '68059075382', 'โครงการซื้อยางรถยนต์พร้อมบริการติดตั้งสำหรับรถยนต์ส่วนกลาง เทศบาลตำบลซึ้ง', '15', '2025-05-22', 28000,
      'เทศบาลตำบลซึ้ง', 'จันทบุรี', 'passenger_car_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2BCxe5%2FjBoHSAkCgXMuIty4So%2FbnY2BklAyNYic06DPfToTqzCAW3xo',
      NULL, NULL, NULL, NULL, 'ยางรถยนต์กระบะมิตซูบิชิ พร้อมบริการติดตั้ง', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68039559334-15', '68039559334', 'โครงการซื้อยางรถยนต์ส่วนกลาง หมายเลขทะเบียน กค 9530 ชัยภูมิ องค์การบริหารส่วนตำบลหนองบัวโคก', '15', '2025-03-27', 24000,
      'องค์การบริหารส่วนตำบลหนองบัวโคก', 'ชัยภูมิ', 'passenger_car_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX195QKSkYUdcqx1Ge37rDW2cjZWJLBiUlna%2F9%2Fn0%2FsNg4I78e2jfovc5',
      NULL, NULL, NULL, NULL, 'ยางรถยนต์นั่งส่วนกลาง', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68099288303-15', '68099288303', 'โครงการซื้อยางรถยนต์ จำนวน 4 เส้น หมายเลขทะเบียน บจ 2486 สมุทรสาคร องค์การบริหารส่วนตำบลบ้านบ่อ', '15', '2025-09-15', 22000,
      'องค์การบริหารส่วนตำบลบ้านบ่อ', 'สมุทรสาคร', 'passenger_car_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2Bg02UkP%2BMefTOvyV28K9pjIsAbovKFdeHIC1iCKiQbQuFybdJnHzTn',
      NULL, NULL, NULL, NULL, 'ยางรถยนต์ 4 เส้น พร้อมเปลี่ยนและถ่วงล้อ', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '67119223830-D0', '67119223830', 'จัดซื้อยางรถยนต์ขนาด 205/85 R16 จำนวน 6 เส้น องค์การบริหารส่วนจังหวัดอ่างทอง', 'D0', '2024-11-20', 68000,
      'องค์การบริหารส่วนจังหวัดอ่างทอง', 'อ่างทอง', 'passenger_car_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2BEcdISmSzaKojhkWhhL43611KjH0UAmbg4rTVxKNiIRScQ49aIgWA1',
      NULL, NULL, NULL, NULL, 'ยางเรเดียลรถกระบะ/บรรทุกเล็ก 205/85 R16 จำนวน 6 เส้น', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '67029034592-15', '67029034592', 'จัดซื้อยางรถยนต์ส่วนกลาง กจ-2953 พร้อมถอดเปลี่ยน เทศบาลตำบลพรหมคีรี', '15', '2024-02-15', 26000,
      'เทศบาลตำบลพรหมคีรี', 'นครศรีธรรมราช', 'passenger_car_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX18x2NYjQPIOKC9QtcVF7pXvYZ1sOsWolWgrItwCrZonyyHPTFfHzYd3',
      NULL, NULL, NULL, NULL, 'ยางรถยนต์ส่วนกลาง พร้อมค่าถอดเปลี่ยนและถ่วงล้อ', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '69049210976-15', '69049210976', 'โครงการจัดซื้อยางรถจักรยานยนต์พร้อมเปลี่ยน หมายเลขทะเบียน 1 กค 7820 องค์การบริหารส่วนตำบลบ้านด้าย', '15', '2026-04-10', 12000,
      'องค์การบริหารส่วนตำบลบ้านด้าย', 'เชียงราย', 'motorcycle_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2B58GY7n18Yp7wJ2icr8VzvJ%2FK31MXiyPstJSHwovKMpDfHthnSIB5F',
      NULL, NULL, NULL, NULL, 'ยางนอกและยางในรถจักรยานยนต์พร้อมค่าบริการเปลี่ยน', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '69049228003-15', '69049228003', 'โครงการจ้างเปลี่ยนยางรถจักรยานยนต์ หมายเลขทะเบียน 1กฐ-3390 นครราชสีมา สำนักงานสรรพากรพื้นที่นครราชสีมา 1', '15', '2026-04-12', 8500,
      'สำนักงานสรรพากรพื้นที่นครราชสีมา 1', 'นครราชสีมา', 'motorcycle_tires', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2FGOtX0NqHP4lnsyC9X4TYrt042aSmhsSqgHCh431XBz2tE%2BNg8K1vS',
      NULL, NULL, NULL, NULL, 'ยางรถจักรยานยนต์สายตรวจและส่งเอกสารราชการ', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68129360976-D0', '68129360976', 'โครงการจัดซื้อยางแทรกเตอร์ฟาร์ม จำนวน 4 เส้น เทศบาลตำบลอาจสามารถ', 'D0', '2025-12-05', 95000,
      'เทศบาลตำบลอาจสามารถ', 'ร้อยเอ็ด', 'otr_heavy_machinery', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2BfExgDmmobIudAakxj6vaExwnP%2BQDH%2BvmWGMH2Zb2Zx4UfRgS7SGOE',
      NULL, NULL, NULL, NULL, 'ยางฟาร์มแทรกเตอร์ขนาดใหญ่ ดอกก้างปลา 4 เส้น', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68099058944-15', '68099058944', 'โครงการจัดซื้อยางรถแทรกเตอร์แชมป์ สำนักงานพระพุทธศาสนาแห่งชาติ', '15', '2025-09-08', 58000,
      'สำนักงานพระพุทธศาสนาแห่งชาติ', 'นครปฐม', 'otr_heavy_machinery', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX1%2FYa7XnCenAZIYAW0vCv8b%2FSFyYWxz0MQlj64gc%2Bq7ne2LCgV8iDLpB',
      NULL, NULL, NULL, NULL, 'ยางรถแทรกเตอร์สำหรับงานดูแลพื้นที่', 1
    );
  

    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '68069386377-W0', '68069386377', 'ประกาศผู้ชนะการเสนอราคา ประกวดราคาซื้อยางนอก - ยางใน ชนิดและขนาดต่าง ๆ จำนวน 5 รายการ กองสรรพาวุธทหารบก', 'W0', '2025-07-02', 14995100,
      'กองสรรพาวุธทหารบก', 'กรุงเทพมหานคร', 'tube_accessories', 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/U2FsdGVkX18wmDTJB5WtXx0hoWM92WLxZEgVFFKdwoBM1cuwQmM0qLuvWs8Z5mV2',
      'ห้างหุ้นส่วนจำกัด ที. แอล เอ็ม.', 14850000, '0103525008741', 0.97, '', 0
    );
  