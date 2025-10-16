import { query } from '../config/database.js';

export const getCompanyProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM company_profile WHERE owner_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const company = result.rows[0];
    
    // Parse social_links if it exists
    if (company.social_links) {
      try {
        company.social_links = typeof company.social_links === 'string' 
          ? JSON.parse(company.social_links) 
          : company.social_links;
      } catch (e) {
        company.social_links = [];
      }
    }

    res.json({
      success: true,
      data: { company }
    });

  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createOrUpdateCompanyProfile = async (req, res) => {
  try {
    const {
      company_name,
      address,
      city,
      state,
      country,
      postal_code,
      website,
      industry,
      founded_date,
      description,
      social_links
    } = req.body;

    if (!company_name || !address || !city || !state || !country || !postal_code || !industry) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if company profile already exists
    const existingCompany = await query(
      'SELECT id FROM company_profile WHERE owner_id = $1',
      [req.userId]
    );

    let result;
    const socialLinksJson = social_links ? JSON.stringify(social_links) : null;
    
    if (existingCompany.rows.length > 0) {
      // Update existing profile
      result = await query(
        `UPDATE company_profile SET 
         company_name = $1, address = $2, city = $3, state = $4, country = $5, 
         postal_code = $6, website = $7, industry = $8, founded_date = $9, 
         description = $10, social_links = $11, updated_at = CURRENT_TIMESTAMP
         WHERE owner_id = $12 RETURNING id`,
        [
          company_name, address, city, state, country, postal_code,
          website, industry, founded_date, description,
          socialLinksJson,
          req.userId
        ]
      );
    } else {
      // Create new profile
      result = await query(
        `INSERT INTO company_profile (
          owner_id, company_name, address, city, state, country, postal_code, 
          website, industry, founded_date, description, social_links
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
          req.userId, company_name, address, city, state, country, postal_code,
          website, industry, founded_date, description,
          socialLinksJson
        ]
      );
    }

    res.json({
      success: true,
      message: existingCompany.rows.length > 0 ? 'Company profile updated successfully' : 'Company profile created successfully',
      data: { company_id: result.rows[0].id }
    });

  } catch (error) {
    console.error('Company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    // Update company profile with logo URL
    await query(
      'UPDATE company_profile SET logo_url = $1 WHERE owner_id = $2',
      [logoUrl, req.userId]
    );

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logo_url: logoUrl }
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Logo upload failed'
    });
  }
};

export const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const bannerUrl = `/uploads/${req.file.filename}`;

    // Update company profile with banner URL
    await query(
      'UPDATE company_profile SET banner_url = $1 WHERE owner_id = $2',
      [bannerUrl, req.userId]
    );

    res.json({
      success: true,
      message: 'Banner uploaded successfully',
      data: { banner_url: bannerUrl }
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Banner upload failed'
    });
  }
};