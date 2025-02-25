import os
import io
import json
import logging
import re
import streamlit as st
from PIL import Image
from dotenv import load_dotenv
from typing import Union, List, Any, Dict
from google.api_core.exceptions import ResourceExhausted
import random
from datetime import datetime, timedelta

import vertexai
from vertexai.generative_models import (
    GenerationConfig,
    GenerativeModel,
    HarmCategory,
    Part,
)
import vertexai.generative_models as generative_models

# Import tenacity for retry logic
from tenacity import retry, stop_after_attempt, wait_exponential

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set Material UI theme
st.set_page_config(
    page_title="Pic2Catalog: Gerador de Catálogo de Produtos",
    page_icon="🛍️",
    layout="wide"
)

# Add Font Awesome for icons
st.markdown("""
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
""", unsafe_allow_html=True)

# Apply custom CSS for Material Design look and feel
st.markdown("""
<style>
    /* E-commerce Colors */
    :root {
        --primary-color: #4A148C;
        --primary-light: #7c43bd;
        --primary-dark: #12005e;
        --secondary-color: #FF6D00;
        --secondary-light: #ff9e40;
        --secondary-dark: #c43e00;
        --background: #F9F9F9;
        --surface: #FFFFFF;
        --error: #B00020;
        --success: #4CAF50;
        --on-primary: #FFFFFF;
        --on-secondary: #000000;
        --on-background: #333333;
        --on-surface: #333333;
        --on-error: #FFFFFF;
        --gray-100: #f5f5f5;
        --gray-200: #eeeeee;
        --gray-300: #e0e0e0;
        --gray-500: #9e9e9e;
        --gray-700: #616161;
    }
    
    /* Base styles */
    body {
        background-color: var(--background);
        color: var(--on-background);
        font-family: 'Roboto', 'Segoe UI', sans-serif;
    }
    
    /* Main container */
    .main .block-container {
        padding: 2rem 1rem;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    /* Headers */
    h1, h2, h3 {
        font-family: 'Roboto', 'Segoe UI', sans-serif;
        font-weight: 500;
        color: var(--primary-color);
    }
    
    h1 {
        font-size: 2.6rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
    }
    
    h2 {
        font-size: 2rem;
        font-weight: 500;
        margin-bottom: 1rem;
    }
    
    h3 {
        font-size: 1.4rem;
        font-weight: 500;
        margin-bottom: 0.75rem;
    }
    
    /* Buttons */
    .stButton > button {
        background-color: var(--primary-color);
        color: white;
        border-radius: 4px;
        border: none;
        padding: 0.75rem 1.5rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.3s;
        font-size: 0.9rem;
    }
    
    .stButton > button:hover {
        background-color: var(--primary-light);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transform: translateY(-2px);
    }
    
    /* File uploader */
    .uploadedFile {
        border: 2px dashed var(--primary-light);
        border-radius: 8px;
        padding: 1.5rem;
        background: var(--surface);
        text-align: center;
    }
    
    /* Cards */
    .card {
        background-color: var(--surface);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        margin-bottom: 1.5rem;
        border: 1px solid var(--gray-200);
        transition: all 0.3s ease;
    }
    
    .card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    
    /* Product card */
    .product-card {
        background-color: var(--surface);
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        overflow: hidden;
        transition: all 0.3s;
        height: 100%;
        border: 1px solid var(--gray-200);
    }
    
    .product-card:hover {
        box-shadow: 0 6px 18px rgba(0,0,0,0.15);
        transform: translateY(-4px);
    }
    
    .product-card-image {
        width: 100%;
        height: 280px;
        object-fit: contain;
        background: white;
        border-bottom: 1px solid var(--gray-200);
    }
    
    .product-card-content {
        padding: 1.5rem;
    }
    
    .product-title {
        font-size: 1.4rem;
        font-weight: 600;
        color: var(--primary-dark);
        margin-bottom: 0.5rem;
        line-height: 1.3;
    }
    
    .product-brand {
        font-size: 1rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
        font-weight: 500;
    }
    
    .product-price {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--secondary-color);
        margin: 1rem 0;
        display: inline-block;
    }
    
    /* Badge */
    .badge {
        display: inline-block;
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        font-weight: 500;
        border-radius: 50px;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .badge-primary {
        background-color: var(--primary-light);
        color: white;
    }
    
    .badge-secondary {
        background-color: var(--secondary-light);
        color: var(--on-secondary);
    }
    
    .badge-info {
        background-color: #e3f2fd;
        color: #0277bd;
    }
    
    /* Feature list */
    .feature-list {
        margin: 1.5rem 0;
    }
    
    .feature-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.75rem;
    }
    
    .feature-icon {
        color: var(--primary-color);
        margin-right: 0.75rem;
        font-size: 1.2rem;
    }
    
    /* Section headers */
    .section-header {
        border-bottom: 2px solid var(--gray-300);
        padding-bottom: 0.75rem;
        margin-bottom: 1.5rem;
        font-weight: 600;
        color: var(--primary-dark);
    }
    
    /* Reviews */
    .review-card {
        border: 1px solid var(--gray-300);
        border-radius: 8px;
        padding: 1.25rem;
        margin-bottom: 1.25rem;
        background: white;
    }
    
    .review-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }
    
    .review-title {
        font-weight: 600;
        color: var(--on-surface);
    }
    
    .review-stars {
        color: #FFC107;
    }
    
    .review-meta {
        color: var(--gray-700);
        font-size: 0.9rem;
        margin-bottom: 0.75rem;
    }
    
    .review-content {
        margin-bottom: 1rem;
        line-height: 1.5;
    }
    
    .review-pros-cons {
        display: flex;
        background-color: var(--gray-100);
        border-radius: 6px;
        padding: 0.75rem;
    }
    
    .review-pros {
        flex: 1;
        padding-right: 0.75rem;
    }
    
    .review-pros-title {
        color: var(--success);
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    .review-cons {
        flex: 1;
        padding-left: 0.75rem;
        border-left: 1px solid var(--gray-300);
    }
    
    .review-cons-title {
        color: var(--error);
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    /* Star ratings */
    .rating-stars {
        display: flex;
        align-items: center;
    }
    
    .star-filled {
        color: #FFC107;
        font-size: 1.25rem;
    }
    
    .star-empty {
        color: var(--gray-300);
        font-size: 1.25rem;
    }
    
    /* JSON display */
    .json-output {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        font-family: 'Roboto Mono', monospace;
        overflow-x: auto;
        border: 1px solid var(--gray-300);
    }
    
    /* Sidebar */
    .css-1d391kg {
        background-color: var(--gray-100);
    }
    
    /* Success message */
    .success-msg {
        background-color: #e8f5e9;
        color: #2e7d32;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 500;
        border-left: 4px solid #2e7d32;
    }
    
    /* Error message */
    .error-msg {
        background-color: #ffebee;
        color: var(--error);
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 500;
        border-left: 4px solid var(--error);
    }
    
    /* E-commerce specific */
    .product-header {
        background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-color) 100%);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .product-header h1 {
        color: white;
        margin-bottom: 0.5rem;
    }
    
    .spec-table {
        width: 100%;
        margin-bottom: 1.5rem;
    }
    
    .spec-table tr {
        border-bottom: 1px solid var(--gray-200);
    }
    
    .spec-table tr:last-child {
        border-bottom: none;
    }
    
    .spec-table td {
        padding: 0.75rem 0;
    }
    
    .spec-table td:first-child {
        font-weight: 500;
        color: var(--primary-color);
        width: 40%;
    }
    
    .color-option {
        display: inline-block;
        margin-right: 10px;
        margin-bottom: 10px;
        text-align: center;
    }
    
    .color-swatch {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: inline-block;
        border: 2px solid var(--gray-300);
        margin-bottom: 5px;
    }
    
    .tab-container {
        margin-top: 2rem;
    }
    
    .review-summary-box {
        background: linear-gradient(135deg, #f5f7fa 0%, #e4eff9 100%);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .summary-header {
        text-align: center;
        margin-bottom: 1.5rem;
        color: var(--primary-dark);
        font-weight: 600;
    }
    
    .summary-content {
        background: white;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    
    .breadcrumb {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
        font-size: 0.9rem;
    }
    
    .breadcrumb-item {
        color: var(--gray-700);
    }
    
    .breadcrumb-item:not(:last-child)::after {
        content: "›";
        margin: 0 0.5rem;
        color: var(--gray-500);
    }
    
    .breadcrumb-item:last-child {
        color: var(--primary-color);
        font-weight: 500;
    }
    
    .product-images {
        position: relative;
    }
    
    .product-badge {
        position: absolute;
        top: 15px;
        left: 15px;
        background: var(--secondary-color);
        color: white;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        font-weight: 500;
        font-size: 0.9rem;
        z-index: 2;
    }
    
    .btn-primary {
        background-color: var(--primary-color);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        border: none;
        font-weight: 500;
        font-size: 1rem;
        cursor: pointer;
        display: inline-block;
        text-align: center;
        transition: all 0.3s;
    }
    
    .btn-primary:hover {
        background-color: var(--primary-light);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .btn-secondary {
        background-color: var(--secondary-color);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        border: none;
        font-weight: 500;
        font-size: 1rem;
        cursor: pointer;
        display: inline-block;
        text-align: center;
        transition: all 0.3s;
    }
    
    .btn-secondary:hover {
        background-color: var(--secondary-light);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .icon-text {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
    }
    
    .icon-text i {
        margin-right: 0.5rem;
        color: var(--primary-color);
    }
</style>
""", unsafe_allow_html=True)

class GeminiRegionClient:
    """
    A client for interacting with Gemini API with region fallback capabilities.
    """
    
    def __init__(self, project_id: str = None, logger: logging.Logger = None):
        """
        Initialize the GeminiRegionClient.
        
        Args:
            project_id (str, optional): Google Cloud Project ID. If None, will try to get from environment.
            logger (logging.Logger, optional): Custom logger instance. If None, will create a new one.
        """
        self.project_id = project_id or os.environ.get("GCP_PROJECT")
        if not self.project_id:
            raise ValueError("Project ID must be provided or set in GCP_PROJECT environment variable")
            
        self.logger = logger or logging.getLogger(__name__)
        
        # List of regions to try
        self.regions = [
            "us-central1",
            "europe-west2",
            "europe-west3",
            "asia-northeast1",
            "australia-southeast1",
            "asia-south1"
        ]
        
        # Safety settings configuration
        self.safety_settings = {
            generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH: generative_models.HarmBlockThreshold.BLOCK_NONE,
            generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: generative_models.HarmBlockThreshold.BLOCK_NONE,
            generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: generative_models.HarmBlockThreshold.BLOCK_NONE,
            generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT: generative_models.HarmBlockThreshold.BLOCK_NONE,
        }
        
        # Default generation config
        self.default_generation_config = GenerationConfig(
            max_output_tokens=8192,
            temperature=0.1,
            top_p=0.95,
            response_mime_type="application/json"
        )

    def _initialize_region(self, region: str) -> None:
        """Initialize Vertex AI with the specified region."""
        vertexai.init(project=self.project_id, location=region)
        
    def _get_model(self) -> GenerativeModel:
        """Get the Gemini model instance."""
        return GenerativeModel("gemini-2.0-flash-001")

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
    def generate_content(self, 
                        prompt: Union[str, List[Union[str, Part]]], 
                        response_mime_type: str = None,
                        **kwargs) -> str:
        """
        Generate content using Gemini model with region fallback.
        
        Args:
            prompt: The input prompt (string or list of string/Part for multimodal)
            response_mime_type: Optional MIME type for the response
            **kwargs: Additional arguments to pass to generate_content
            
        Returns:
            str: Generated content
            
        Raises:
            Exception: If all regions fail
        """
        last_error = None
        
        for region in self.regions:
            try:
                self._initialize_region(region)
                model = self._get_model()
                
                # Prepare generation config
                gen_config = kwargs.pop('generation_config', self.default_generation_config)
                if response_mime_type:
                    gen_config = GenerationConfig(
                        **gen_config.to_dict(),
                        response_mime_type=response_mime_type
                    )
                
                # Process multimodal input if needed
                if isinstance(prompt, list) and len(prompt) == 2:
                    image_content, text_prompt = prompt
                    if not isinstance(image_content, Part):
                        image_content = Part.from_data(image_content, mime_type="image/jpeg")
                    prompt = [image_content, text_prompt]
                
                response = model.generate_content(
                    prompt,
                    generation_config=gen_config,
                    safety_settings=self.safety_settings,
                    **kwargs
                )
                
                return response.text
                
            except ResourceExhausted as e:
                self.logger.warning(f"Region {region} exhausted. Trying next region...")
                last_error = e
            except Exception as e:
                self.logger.warning(f"Unexpected error with region {region}: {str(e)}")
                last_error = e
        
        raise Exception(f"All regions failed. Last error: {str(last_error)}") from last_error


def clean_json_response(response_text):
    """
    Clean the JSON response from Gemini to ensure it's valid JSON.
    
    Args:
        response_text: The raw text response from Gemini
        
    Returns:
        dict: Parsed JSON object
    """
    # Remove markdown code block markers if present
    cleaned_text = re.sub(r'^```json\s*', '', response_text, flags=re.MULTILINE)
    cleaned_text = re.sub(r'\s*```$', '', cleaned_text, flags=re.MULTILINE)
    
    # Remove any other markdown formatting that might be present
    cleaned_text = re.sub(r'^```\s*', '', cleaned_text, flags=re.MULTILINE)
    
    try:
        # Parse the cleaned text as JSON
        return json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        logger.error(f"Cleaned text: {cleaned_text}")
        raise ValueError(f"Failed to parse JSON response: {e}")


def generate_product_catalog_info(client, image_bytes):
    """
    Generate product catalog information using Gemini.
    
    Args:
        client: GeminiRegionClient instance
        image_bytes: Image bytes to analyze
        
    Returns:
        dict: Generated product catalog information as a JSON object
    """
    # Define the catalog schema
    catalog_schema = {
        "type": "OBJECT",
        "properties": {
            "Nome do Produto": {"type": "STRING"},
            "Marca": {"type": "STRING"},
            "Categoria": {"type": "STRING"},
            "Subcategoria": {"type": "STRING"},
            "Descrição Curta": {"type": "STRING"},
            "Descrição Longa": {"type": "STRING"},
            "Características Principais": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "minItems": 3
            },
            "Especificações Técnicas": {
                "type": "OBJECT",
                "properties": {
                    "Material": {"type": "STRING"},
                    "Modelo": {"type": "STRING"},
                    "Fabricante": {"type": "STRING"},
                    "País de Origem": {"type": "STRING"},
                    "Garantia": {"type": "STRING"},
                    "Certificações": {"type": "STRING"}
                }
            },
            "Dimensões": {
                "type": "OBJECT",
                "properties": {
                    "Altura": {"type": "STRING"},
                    "Largura": {"type": "STRING"},
                    "Profundidade": {"type": "STRING"},
                    "Peso": {"type": "STRING"}
                }
            },
            "Opções de Cores": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "minItems": 1
            },
            "Faixa de Preço Sugerida": {"type": "STRING"},
            "Público-Alvo": {"type": "STRING"},
            "Palavras-chave SEO": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "minItems": 3
            },
            "Tags de Busca": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "minItems": 3
            }
        },
        "required": [
            "Nome do Produto",
            "Categoria",
            "Descrição Curta",
            "Descrição Longa",
            "Características Principais"
        ],
        "propertyOrdering": [
            "Nome do Produto",
            "Marca",
            "Categoria",
            "Subcategoria",
            "Descrição Curta",
            "Descrição Longa",
            "Características Principais",
            "Especificações Técnicas",
            "Dimensões",
            "Opções de Cores",
            "Faixa de Preço Sugerida",
            "Público-Alvo",
            "Palavras-chave SEO",
            "Tags de Busca"
        ]
    }

    generation_config = GenerationConfig(
        max_output_tokens=8192,
        temperature=0.1,
        top_p=0.95,
        response_mime_type="application/json",
        response_schema=catalog_schema
    )

    prompt = [
        image_bytes,
        """Gere uma entrada detalhada de catálogo de e-commerce para este item em português. Inclua:

1. Nome do Produto
2. Marca (se visível)
3. Categoria
4. Subcategoria
5. Descrição Curta (50-60 palavras)
6. Descrição Longa (100-150 palavras)
7. Características Principais (mínimo 3 características)
8. Especificações Técnicas (incluindo material, modelo, fabricante, país de origem, garantia e certificações)
9. Dimensões (altura, largura, profundidade e peso)
10. Opções de Cores (mínimo 1 cor)
11. Faixa de Preço Sugerida
12. Público-Alvo
13. Palavras-chave SEO (mínimo 3 palavras-chave)
14. Tags de Busca (mínimo 3 tags)

A saída deve seguir estritamente o schema JSON fornecido.
"""
    ]
    
    response_text = client.generate_content(prompt, generation_config=generation_config)
    return clean_json_response(response_text)


def generate_product_reviews(client, product_info: Dict):
    """
    Generate AI reviews for the product using Gemini.
    
    Args:
        client: GeminiRegionClient instance
        product_info: Dictionary containing product information
        
    Returns:
        dict: Generated reviews and summary
    """
    # Define the reviews schema
    reviews_schema = {
        "type": "OBJECT",
        "properties": {
            "reviews": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "nome": {"type": "STRING"},
                        "estrelas": {"type": "INTEGER", "minimum": 1, "maximum": 5},
                        "titulo": {"type": "STRING"},
                        "texto": {"type": "STRING"},
                        "data": {"type": "STRING", "format": "date"},
                        "pros": {"type": "ARRAY", "items": {"type": "STRING"}, "minItems": 1},
                        "contras": {"type": "ARRAY", "items": {"type": "STRING"}}
                    },
                    "required": ["nome", "estrelas", "titulo", "texto", "data", "pros"]
                },
                "minItems": 5,
                "maxItems": 5
            }
        },
        "required": ["reviews"],
        "propertyOrdering": ["reviews"]
    }

    generation_config = GenerationConfig(
        max_output_tokens=8192,
        temperature=0.7,
        top_p=0.95,
        response_mime_type="application/json",
        response_schema=reviews_schema
    )

    prompt = f"""Com base nas informações do produto abaixo, gere 5 avaliações realistas de usuários em português.
    Cada avaliação deve incluir:
    1. Nome do usuário
    2. Classificação (1-5 estrelas)
    3. Título da avaliação
    4. Texto da avaliação (2-3 frases)
    5. Data (formato YYYY-MM-DD, últimos 30 dias)
    6. Prós (mínimo 1) e Contras (opcional)

    Informações do Produto:
    Nome: {product_info.get('Nome do Produto', '')}
    Descrição: {product_info.get('Descrição Curta', '')}
    Características: {product_info.get('Características Principais', [])}

    A saída deve seguir estritamente o schema JSON fornecido.
    """
    
    response_text = client.generate_content(prompt, generation_config=generation_config)
    reviews_data = clean_json_response(response_text)
    
    # Define the summary schema
    summary_schema = {
        "type": "OBJECT",
        "properties": {
            "pontos_fortes": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "minItems": 3
            },
            "criticas": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            },
            "sentimento_geral": {"type": "STRING"},
            "recomendacoes": {"type": "STRING"}
        },
        "required": ["pontos_fortes", "criticas", "sentimento_geral", "recomendacoes"],
        "propertyOrdering": ["pontos_fortes", "criticas", "sentimento_geral", "recomendacoes"]
    }

    summary_generation_config = GenerationConfig(
        max_output_tokens=8192,
        temperature=0.3,
        top_p=0.95,
        response_mime_type="application/json",
        response_schema=summary_schema
    )

    summary_prompt = f"""Com base nas avaliações abaixo, gere um resumo conciso em português que destaque:
    1. Pontos fortes mais mencionados (mínimo 3)
    2. Principais críticas (se houver)
    3. Sentimento geral dos usuários
    4. Recomendações para potenciais compradores

    Avaliações:
    {json.dumps(reviews_data, ensure_ascii=False, indent=2)}

    A saída deve seguir estritamente o schema JSON fornecido.
    """
    
    summary_response = client.generate_content(summary_prompt, generation_config=summary_generation_config)
    summary_data = clean_json_response(summary_response)
    
    return {
        "reviews": reviews_data["reviews"],
        "summary": summary_data
    }

def render_product_page(product_info: Dict, reviews_info: Dict):
    """Render a beautiful product page with the generated information"""
    
    # Calculate average rating
    reviews = reviews_info.get('reviews', [])
    avg_rating = round(sum(review['estrelas'] for review in reviews) / len(reviews), 1) if reviews else 0
    avg_rating_display = str(avg_rating)
    star_filled = "★" * int(avg_rating)
    star_empty = "☆" * (5 - int(avg_rating))
    reviews_count = str(len(reviews))
    
    # Get summary data early to avoid f-string issues
    summary = reviews_info.get('summary', {})
    sentimento_geral = summary.get('sentimento_geral', '')
    recomendacoes = summary.get('recomendacoes', '')
    
    # Breadcrumb navigation
    st.markdown(f"""
    <ul class="breadcrumb">
        <li class="breadcrumb-item">Home</li>
        <li class="breadcrumb-item">{product_info.get('Categoria', '')}</li>
        <li class="breadcrumb-item">{product_info.get('Subcategoria', '')}</li>
        <li class="breadcrumb-item">{product_info.get('Nome do Produto', '')}</li>
    </ul>
    """, unsafe_allow_html=True)
    
    # Product Header with Brand Banner
    st.markdown(f"""
    <div class="product-header">
        <h1>{product_info.get('Nome do Produto', '')}</h1>
        <p style="color: #e0e0e0; font-size: 1.2em; margin-bottom: 0.5rem;">
            {product_info.get('Marca', 'Marca não especificada')}
        </p>
        <div class="rating-stars">
            <span class="star-filled">{star_filled}</span>
            <span class="star-empty">{star_empty}</span>
            <span style="margin-left: 0.5rem; color: #e0e0e0;">{avg_rating_display}/5 ({reviews_count} avaliações)</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Main Product Section with Image
    col1, col2 = st.columns([1.2, 2])
    
    with col1:
        # Product Image
        if 'image' in st.session_state:
            st.markdown("""
            <div class="product-images">
                <div class="product-badge">NOVO</div>
            """, unsafe_allow_html=True)
            st.image(st.session_state.image, use_column_width=True)
            st.markdown("</div>", unsafe_allow_html=True)
            
            # Price and Call-to-Action Buttons
            st.markdown(f"""
            <div class="card" style="margin-top: 1.5rem;">
                <div style="font-size: 0.9rem; color: var(--gray-700); margin-bottom: 0.5rem;">Preço sugerido:</div>
                <div class="product-price">{product_info.get('Faixa de Preço Sugerida', '')}</div>
                
                <div style="margin: 1.5rem 0;">
                    <a href="#" class="btn-primary" style="display: block; margin-bottom: 1rem;">
                        <i class="fas fa-shopping-cart"></i> Adicionar ao Carrinho
                    </a>
                    <a href="#" class="btn-secondary" style="display: block;">
                        <i class="fas fa-heart"></i> Adicionar à Lista de Desejos
                    </a>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <div class="icon-text">
                        <i class="fas fa-truck"></i> Frete Grátis para todo o Brasil
                    </div>
                    <div class="icon-text">
                        <i class="fas fa-sync"></i> Devolução gratuita em até 30 dias
                    </div>
                    <div class="icon-text">
                        <i class="fas fa-shield-alt"></i> Garantia de 12 meses
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    with col2:
        # Product tabs for info
        tab1, tab2, tab3 = st.tabs(["Descrição", "Especificações", "Avaliações"])
        
        with tab1:
            st.markdown(f"""
            <div class="card">
                <h3 class="section-header">Sobre este produto</h3>
                <p style="line-height: 1.6; margin-bottom: 1.5rem;">
                    {product_info.get('Descrição Longa', '')}
                </p>
                
                <h4 style="color: var(--primary-color); margin-bottom: 1rem;">
                    ✨ Características Principais
                </h4>
                <div class="feature-list">
            """, unsafe_allow_html=True)
            
            for feature in product_info.get('Características Principais', []):
                st.markdown(f"""
                <div class="feature-item">
                    <span class="feature-icon">•</span>
                    <span>{feature}</span>
                </div>
                """, unsafe_allow_html=True)
            
            st.markdown("""
                </div>
                
                <h4 style="color: var(--primary-color); margin: 1.5rem 0 1rem 0;">
                    🎯 Público-Alvo
                </h4>
            """, unsafe_allow_html=True)
            
            st.markdown(f"""
                <p>{product_info.get('Público-Alvo', '')}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # SEO Tags and Keywords
            st.markdown("""
            <div class="card">
                <h4 style="color: var(--primary-color); margin-bottom: 1rem;">
                    🏷️ Tags de Produto
                </h4>
            """, unsafe_allow_html=True)
            
            for tag in product_info.get('Tags de Busca', []):
                st.markdown(f'<span class="badge badge-info">{tag}</span>', unsafe_allow_html=True)
            
            st.markdown("</div>", unsafe_allow_html=True)
        
        with tab2:
            st.markdown("""
            <div class="card">
                <h3 class="section-header">Especificações Técnicas</h3>
                <table class="spec-table">
            """, unsafe_allow_html=True)
            
            specs = product_info.get('Especificações Técnicas', {})
            if isinstance(specs, dict):
                for key, value in specs.items():
                    st.markdown(f"""
                    <tr>
                        <td>{key}</td>
                        <td>{value}</td>
                    </tr>
                    """, unsafe_allow_html=True)
            
            st.markdown("""
                </table>
            </div>
            """, unsafe_allow_html=True)
            
            # Dimensions Section
            dimensions = product_info.get('Dimensões', {})
            if dimensions:
                st.markdown("""
                <div class="card">
                    <h3 class="section-header">📏 Dimensões e Peso</h3>
                    <table class="spec-table">
                """, unsafe_allow_html=True)
                
                if isinstance(dimensions, dict):
                    for key, value in dimensions.items():
                        st.markdown(f"""
                        <tr>
                            <td>{key}</td>
                            <td>{value}</td>
                        </tr>
                        """, unsafe_allow_html=True)
                
                st.markdown("""
                    </table>
                </div>
                """, unsafe_allow_html=True)
            
            # Colors Section
            colors = product_info.get('Opções de Cores', [])
            if colors:
                st.markdown("""
                <div class="card">
                    <h3 class="section-header">🎨 Cores Disponíveis</h3>
                    <div style="margin-top: 1rem;">
                """, unsafe_allow_html=True)
                
                color_map = {
                    'Preto': '#000000', 'Branco': '#FFFFFF', 'Vermelho': '#ff3b30', 'Azul': '#007aff', 
                    'Verde': '#34c759', 'Amarelo': '#ffcc00', 'Laranja': '#ff9500', 'Roxo': '#af52de',
                    'Rosa': '#ff2d55', 'Cinza': '#8e8e93', 'Marrom': '#a2845e', 'Dourado': '#d4af37',
                    'Prata': '#c0c0c0', 'Bege': '#f5f5dc', 'Turquesa': '#40e0d0'
                }
                
                if isinstance(colors, list):
                    for color in colors:
                        color_hex = color_map.get(color, '#cccccc')
                        st.markdown(f"""
                        <div class="color-option">
                            <div class="color-swatch" style="background-color: {color_hex};"></div>
                            <div>{color}</div>
                        </div>
                        """, unsafe_allow_html=True)
                
                st.markdown("""
                    </div>
                </div>
                """, unsafe_allow_html=True)
        
        with tab3:
            # Review Summary
            summary = reviews_info.get('summary', {})
            # Build the review summary HTML with proper string substitution
            review_summary_html = f"""
            <div class="review-summary-box">
                <h3 class="summary-header">O que os Clientes estão dizendo</h3>
                <div class="summary-content">
                    <div style="display: flex; margin-bottom: 1.5rem;">
                        <div style="text-align: center; padding-right: 1.5rem; border-right: 1px solid var(--gray-300); margin-right: 1.5rem;">
                            <div style="font-size: 3rem; font-weight: 700; color: var(--primary-color);">
                                {avg_rating_display}
                            </div>
                            <div class="rating-stars" style="justify-content: center;">
                                <span class="star-filled">{star_filled}</span>
                                <span class="star-empty">{star_empty}</span>
                            </div>
                            <div style="color: var(--gray-700); margin-top: 0.5rem;">
                                {reviews_count} avaliações
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <h4 style="color: var(--primary-color); margin-bottom: 1rem;">Destaques</h4>
            """
            
            st.markdown(review_summary_html, unsafe_allow_html=True)
            
            for point in summary.get('pontos_fortes', []):
                st.markdown(f"""
                <div class="feature-item">
                    <span class="feature-icon" style="color: var(--success);">✓</span>
                    <span>{point}</span>
                </div>
                """, unsafe_allow_html=True)
            
            sentiment_section = f"""
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid var(--gray-300); padding-top: 1.5rem;">
                        <h4 style="color: var(--primary-color); margin-bottom: 1rem;">Sentimento Geral</h4>
                        <p style="line-height: 1.6; margin-bottom: 1rem;">
                            {sentimento_geral}
                        </p>
                        
                        <h4 style="color: var(--primary-color); margin: 1rem 0;">Recomendações</h4>
                        <p style="line-height: 1.6;">
                            {recomendacoes}
                        </p>
                    </div>
                </div>
            </div>
            """
            
            st.markdown(sentiment_section, unsafe_allow_html=True)
            
            # Individual Reviews
            st.markdown("<h3 class='section-header'>Avaliações de Clientes</h3>", unsafe_allow_html=True)
            
            for i, review in enumerate(reviews):
                stars = "★" * review['estrelas'] + "☆" * (5 - review['estrelas'])
                st.markdown(f"""
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-title">{review['titulo']}</div>
                        <div class="review-stars">{stars}</div>
                    </div>
                    <div class="review-meta">por {review['nome']} • {review['data']}</div>
                    <div class="review-content">{review['texto']}</div>
                """, unsafe_allow_html=True)
                
                if review.get('pros') or review.get('contras'):
                    st.markdown("""
                    <div class="review-pros-cons">
                    """, unsafe_allow_html=True)
                    
                    if review.get('pros'):
                        st.markdown("""
                        <div class="review-pros">
                            <div class="review-pros-title">Prós</div>
                        """, unsafe_allow_html=True)
                        for pro in review['pros']:
                            st.markdown(f"""
                            <div class="feature-item">
                                <span class="feature-icon" style="color: var(--success);">✓</span>
                                <span>{pro}</span>
                            </div>
                            """, unsafe_allow_html=True)
                        st.markdown("</div>", unsafe_allow_html=True)
                    
                    if review.get('contras'):
                        st.markdown("""
                        <div class="review-cons">
                            <div class="review-cons-title">Contras</div>
                        """, unsafe_allow_html=True)
                        for contra in review['contras']:
                            st.markdown(f"""
                            <div class="feature-item">
                                <span class="feature-icon" style="color: var(--error);">×</span>
                                <span>{contra}</span>
                            </div>
                            """, unsafe_allow_html=True)
                        st.markdown("</div>", unsafe_allow_html=True)
                    
                    st.markdown("</div>", unsafe_allow_html=True)
                
                st.markdown("</div>", unsafe_allow_html=True)

def main():
    st.title("🛍️ Pic2Catalog")
    
    # Create tabs
    tab1, tab2 = st.tabs(["Gerador de Catálogo", "Visualização do Produto"])
    
    # Store session state for product info and reviews
    if 'product_info' not in st.session_state:
        st.session_state.product_info = None
    if 'reviews_info' not in st.session_state:
        st.session_state.reviews_info = None
    if 'image' not in st.session_state:
        st.session_state.image = None
    
    with tab1:
        st.subheader("Gerador de Catálogo de Produtos com IA")
        
        st.markdown("""
        <div class="card">
            Faça upload de uma imagem do produto e deixe a IA gerar uma entrada completa de catálogo para sua loja online!
        </div>
        """, unsafe_allow_html=True)
        
        # Check for GCP project ID
        project_id = os.environ.get("GCP_PROJECT")
        if not project_id:
            st.markdown("""
            <div class="error-msg">
                ⚠️ A variável de ambiente GCP_PROJECT não está configurada. Por favor, configure-a para usar este aplicativo.
                <br>Você pode configurá-la criando um arquivo .env com GCP_PROJECT=seu-project-id
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Sidebar with instructions
        with st.sidebar:
            st.header("Como usar")
            st.markdown("""
            <div class="card">
                <ol>
                    <li>Faça upload de uma imagem clara do seu produto</li>
                    <li>Aguarde a IA analisar a imagem</li>
                    <li>Receba uma entrada completa de catálogo para sua loja online</li>
                    <li>Copie o conteúdo gerado ou exporte-o</li>
                </ol>
            </div>
            """, unsafe_allow_html=True)
            
            st.header("Sobre")
            st.markdown("""
            <div class="card">
                O Pic2Catalog usa o modelo Gemini 1.5 Flash do Google para gerar informações 
                detalhadas de produtos a partir de imagens. Esta ferramenta ajuda empresas 
                de e-commerce a criar listagens de produtos profissionais rapidamente.
            </div>
            """, unsafe_allow_html=True)
        
        # Initialize Gemini client
        try:
            gemini_client = GeminiRegionClient(project_id=project_id, logger=logger)
        except Exception as e:
            st.markdown(f"""
            <div class="error-msg">
                Falha ao inicializar o cliente Gemini: {str(e)}
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Image upload
        uploaded_file = st.file_uploader("Faça upload de uma imagem do produto", type=["jpg", "jpeg", "png"])
        
        if uploaded_file:
            # Display the uploaded image
            image = Image.open(uploaded_file)
            st.session_state.image = image  # Store image in session state
            col1, col2 = st.columns([1, 2])
            
            with col1:
                st.markdown('<div class="card">', unsafe_allow_html=True)
                st.image(image, caption="Produto Enviado", use_column_width=True)
                st.markdown('</div>', unsafe_allow_html=True)
            
            with col2:
                st.markdown('<div class="card">', unsafe_allow_html=True)
                # Process image button
                if st.button("Gerar Entrada de Catálogo"):
                    with st.spinner("Analisando imagem e gerando informações do catálogo..."):
                        try:
                            # Convert image to bytes
                            buffer = io.BytesIO()
                            image.save(buffer, format="JPEG")
                            image_bytes = buffer.getvalue()
                            
                            # Generate catalog information
                            catalog_info = generate_product_catalog_info(gemini_client, image_bytes)
                            st.session_state.product_info = catalog_info
                            
                            # Generate reviews
                            with st.spinner("Gerando avaliações de usuários..."):
                                reviews_info = generate_product_reviews(gemini_client, catalog_info)
                                st.session_state.reviews_info = reviews_info
                            
                            # Show results
                            st.markdown("""
                            <div class="success-msg">
                                ✅ Entrada de catálogo e avaliações geradas com sucesso!
                            </div>
                            """, unsafe_allow_html=True)
                            
                            # Display the JSON in a pretty format
                            st.markdown('<div class="json-output">', unsafe_allow_html=True)
                            st.json(catalog_info)
                            st.markdown('</div>', unsafe_allow_html=True)
                            
                            # Add download button for the generated content
                            st.download_button(
                                label="Baixar JSON",
                                data=json.dumps(catalog_info, indent=2, ensure_ascii=False),
                                file_name="catalogo_produto.json",
                                mime="application/json"
                            )
                            
                            # Show message about the product page
                            st.markdown("""
                            <div class="success-msg" style="margin-top: 20px;">
                                ℹ️ Acesse a aba "Visualização do Produto" para ver a página do produto gerada!
                            </div>
                            """, unsafe_allow_html=True)
                            
                        except Exception as e:
                            st.markdown(f"""
                            <div class="error-msg">
                                Erro ao gerar informações do catálogo: {str(e)}
                            </div>
                            """, unsafe_allow_html=True)
                            logger.error(f"Erro na geração do catálogo: {e}", exc_info=True)
                st.markdown('</div>', unsafe_allow_html=True)
        else:
            # Show sample images when no upload
            st.markdown("""
            <div class="card">
                Por favor, faça upload de uma imagem do produto para gerar uma entrada de catálogo.
            </div>
            """, unsafe_allow_html=True)
    
    with tab2:
        if st.session_state.product_info and st.session_state.reviews_info:
            render_product_page(st.session_state.product_info, st.session_state.reviews_info)
        else:
            st.markdown("""
            <div style="text-align: center; padding: 40px; background: #f5f5f5; border-radius: 10px;">
                <h2 style="color: #1a237e;">Nenhum produto gerado ainda</h2>
                <p style="color: #666; font-size: 1.2em;">
                    Faça o upload de uma imagem na aba "Gerador de Catálogo" para visualizar a página do produto.
                </p>
            </div>
            """, unsafe_allow_html=True)

if __name__ == "__main__":
    main() 