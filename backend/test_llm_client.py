# backend/test_llm_client.py

from llm_client import LLMClient

def test_classify_returns_expected_shape_english():
    client = LLMClient()
    result = client.classify("There is a huge pothole on MG Road causing accidents")
    assert "category" in result
    assert "priority" in result
    assert "location" in result
    assert result["category"] in ["Roads", "Water", "Electricity", "Sanitation", "Public Safety", "Other"]
    assert result["priority"] in ["Low", "Medium", "High"]

def test_classify_returns_expected_shape_hindi():
    client = LLMClient()
    result = client.classify("सड़क पर बड़ा गड्ढा है, दुर्घटना का खतरा है")
    assert "category" in result
    assert "priority" in result
    assert "location" in result
    assert result["category"] in ["Roads", "Water", "Electricity", "Sanitation", "Public Safety", "Other"]
    assert result["priority"] in ["Low", "Medium", "High"]
