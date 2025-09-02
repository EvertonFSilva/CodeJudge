from fastapi import APIRouter
from fastapi.responses import JSONResponse
from Core.Container.Container import getPromptManager

router = APIRouter(prefix="/prompts", tags=["prompts"])

def getPromptMgr():
    return getPromptManager()

@router.get("/all", summary="Lista todos os prompts", description="Retorna todos os prompts disponíveis no sistema com metadados.")
def getAllPrompts():
    pm = getPromptMgr()
    categories = list(pm.configurationManager.get("prompts.paths", {}).keys())
    allPrompts = {}

    for category in categories:
        promptsInCategory = pm.prompts.get(category, {})
        if promptsInCategory:
            allPrompts[category] = {}
            for promptName, promptContent in promptsInCategory.items():
                metadata = pm.getMetadata(category, promptName)
                allPrompts[category][promptName] = {
                    "metadata": metadata,
                    "content": promptContent
                }

    return JSONResponse(content={"templates": allPrompts})


@router.get("/category/{category}", summary="Lista prompts por categoria",
            description="Retorna todos os prompts disponíveis dentro de uma categoria específica com metadados.")
def getCategoryPrompts(category):
    pm = getPromptMgr()
    promptsInCategory = pm.prompts.get(category, {})
    result = {}
    for promptName, promptContent in promptsInCategory.items():
        metadata = pm.getMetadata(category, promptName)
        result[promptName] = {
            "metadata": metadata,
            "content": promptContent
        }
    return JSONResponse(content={"templates": result})


@router.get("/single/{category}/{promptName}", summary="Obtém um prompt específico",
            description="Retorna o conteúdo de um prompt específico, dado o nome e a categoria, incluindo os metadados.")
def getSinglePrompt(category, promptName):
    pm = getPromptMgr()
    promptContent = pm.getPrompt(category, promptName)
    if not promptContent:
        return JSONResponse(content={"error": "prompt não encontrado"})

    metadata = pm.getMetadata(category, promptName)
    return JSONResponse(content={
        "prompt": promptContent,
        "metadata": metadata
    })
