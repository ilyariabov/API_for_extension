from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymorphy2
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

morph = pymorphy2.MorphAnalyzer()


class LemmaRequest(BaseModel):
    words: list[list[str]]


@app.post("/lemmatize")
async def lemmatize(req: LemmaRequest):

    result = []

    for row in req.words:

        processed_row = []

        for word in row:

            clean_word = re.sub(r"\W+", "", word.lower())

            if clean_word:
                lemma = morph.parse(clean_word)[0].normal_form
                processed_row.append(lemma)

        result.append(processed_row)

    return {
        "result": result
    }