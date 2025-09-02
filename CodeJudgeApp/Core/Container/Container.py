engineRegistry = None
compilerRegistry = None
executorRegistry = None
promptManager = None

analysisService = None
compilationService = None
executionService = None
optimizationService = None
errorCodeService = None

# ---- Setters ----
def setEngineRegistry(reg):
    global engineRegistry
    engineRegistry = reg

def setCompilerRegistry(reg):
    global compilerRegistry
    compilerRegistry = reg

def setExecutorRegistry(reg):
    global executorRegistry
    executorRegistry = reg

def setPromptManager(pm):
    global promptManager
    promptManager = pm

# ---- Service setters ----
def setAnalysisCodeService(svc):
    global analysisService
    analysisService = svc

def setCompilationCodeService(svc):
    global compilationService
    compilationService = svc

def setExecutionCodeService(svc):
    global executionService
    executionService = svc

def setOptimizationCodeService(svc):
    global optimizationService
    optimizationService = svc

def setErrorCodeService(svc):
    global errorCodeService
    errorCodeService = svc

# ---- Getters ----
def getEngineRegistry():
    return engineRegistry

def getCompilerRegistry():
    return compilerRegistry

def getExecutorRegistry():
    return executorRegistry

def getPromptManager():
    return promptManager

def getAnalysisCodeService():
    return analysisService

def getCompilationCodeService():
    return compilationService

def getExecutionCodeService():
    return executionService

def getOptimizationCodeService():
    return optimizationService

def getErrorCodeService():
    return errorCodeService
