# Pic2Catalog: AI Product Catalog Generator

Pic2Catalog is a Streamlit application that uses Google's Gemini 1.5 model to automatically generate detailed product catalog information from images. This tool helps e-commerce businesses quickly create professional product listings with rich attributes.

## Features

- Upload product images and get detailed catalog information
- Generate comprehensive product attributes:
  - Product name and brand
  - Category and subcategory
  - Short and long descriptions
  - Key features and specifications
  - Material, dimensions, and color options
  - Price range and target audience
  - SEO keywords and search tags
- Export results as JSON for easy integration

## Setup Instructions

### Prerequisites

- Python 3.9+
- Google Cloud Platform account with Vertex AI API enabled

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/pic2catalog.git
   cd pic2catalog
   ```

2. Install required packages:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file and add your Google Cloud Project ID:
   ```
   GCP_PROJECT=your-project-id-here
   ```

5. Set up Google Cloud authentication:
   ```
   gcloud auth application-default login
   ```
   This command sets up Application Default Credentials (ADC), which will be automatically used by the application.

### Running the Application

Start the Streamlit app:
```
streamlit run app.py
```

The application will be available at http://localhost:8501

## Usage

1. Open the application in your web browser
2. Upload a clear image of your product
3. Click "Generate Catalog Entry"
4. Review the generated catalog information
5. Download the JSON output for use in your e-commerce platform

## Contributing

Contributions to Pic2Catalog are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.