import uvicorn


def run_dev():
    uvicorn.run("src.main:app", reload=True, port=8000)


def run_start():
    uvicorn.run("src.main:app", port=8000)
