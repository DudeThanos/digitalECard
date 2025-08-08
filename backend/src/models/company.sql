-- Company Master Table
CREATE TABLE IF NOT EXISTS company_master (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_name, branch_name)
);

-- Insert some sample data
INSERT INTO company_master (company_name, branch_name, logo_url) VALUES
('Kaynes Technology', 'Mumbai', '/uploads/company_logos/kaynes_mumbai.png'),
('Kaynes Technology', 'Bangalore', '/uploads/company_logos/kaynes_bangalore.png'),
('Kaynes Technology', 'Delhi', '/uploads/company_logos/kaynes_delhi.png'),
('Kaynes Technology', 'Chennai', '/uploads/company_logos/kaynes_chennai.png'),
('Kaynes Technology', 'Pune', '/uploads/company_logos/kaynes_pune.png')
ON CONFLICT (company_name, branch_name) DO NOTHING; 