import os
import io
import json
import logging
import re
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from dotenv import load_dotenv
from typing import Union, List, Any, Dict, Optional
from google.api_core.exceptions import ResourceExhausted
import random
from datetime import datetime, timedelta
from pydantic import BaseModel

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

# Init FastAPI
app = FastAPI(
    title="Pic2Catalog API",
    description="API for generating product catalog entries from images",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# API Models
class ProductInfo(BaseModel):
    catalog_info: Dict[str, Any]
    reviews_info: Dict[str, Any]

# API Routes
@app.get("/")
async def root():
    return {"message": "Welcome to the Pic2Catalog API"}

@app.post("/generate_catalog", response_model=ProductInfo)
async def create_product_catalog(file: UploadFile = File(...)):
    """Generate product catalog information from an uploaded image"""
    
    # Check for project ID
    project_id = os.environ.get("GCP_PROJECT")
    if not project_id:
        raise HTTPException(status_code=500, detail="GCP_PROJECT environment variable not set")
    
    # Initialize Gemini client
    try:
        gemini_client = GeminiRegionClient(project_id=project_id, logger=logger)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Gemini client: {str(e)}")
    
    # Process uploaded image
    try:
        # Read image file
        contents = await file.read()
        
        # Convert to PIL Image for validation and possible processing
        image = Image.open(io.BytesIO(contents))
        
        # Convert image back to bytes for API call
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format=image.format or 'JPEG')
        image_bytes = img_byte_arr.getvalue()
        
        # Generate catalog information
        catalog_info = generate_product_catalog_info(gemini_client, image_bytes)
        
        # Generate reviews
        reviews_info = generate_product_reviews(gemini_client, catalog_info)
        
        return ProductInfo(catalog_info=catalog_info, reviews_info=reviews_info)
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 