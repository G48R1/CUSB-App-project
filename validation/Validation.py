import json
import jsonschema
from referencing import Registry, Resource
from pathlib import Path

import os
os.chdir(os.path.dirname(__file__))


# Percorso cartella schemi
SCHEMA_DIR = "./schemas"
CANTI_DIR = "../libretto/canti"

class Validation:
    def __init__(self):
        self._schema_dir = SCHEMA_DIR
        self.registry, self.root_schema = self.load_schemas()
    
    def setDir(self, schema_dir):
        self._schema_dir = schema_dir
    
    def setRootSchema(self, root_schema):
        if (not root_schema.endswith(".schema.json")):
            root_schema = root_schema + ".schema.json"
        self.registry, self.root_schema = self.load_schemas(root_schema)
    
    def validate(self, filename):
        # Carica file da validare
        with open(filename, encoding="utf-8") as f:
            instance = json.load(f)

        # Validatore
        validator_class = jsonschema.validators.validator_for(self.root_schema)
        validator = validator_class(schema=self.root_schema, registry=self.registry)

        try:
            validator.validate(instance)
            print("✅ JSON valido!")
            return {"is_valid": True, "message": "ciao"}
        except jsonschema.ValidationError as e:
            print("❌ Errore di validazione:")
            print(e.message)
            return {"is_valid": False, "message": e.message}

    # Carica schemi (tutti quelli nella cartella self.schema_dir)
    def load_schemas(self, root_schema="canto-singolo.schema.json"):
        schema_files = [f for f in os.listdir(self._schema_dir) if f.endswith(".schema.json")]
        schemas = {}
        for fname in schema_files:
            with open(os.path.join(self._schema_dir, fname), encoding="utf-8") as f:
                schemas[fname] = json.load(f)
        # Schema root
        root_schema = schemas[root_schema]
        # Registry schemi
        registry = Registry()
        for name, schema in schemas.items():
            registry = registry.with_resource(name, Resource.from_contents(schema))

        return registry, root_schema

# schemi = ["accordo", "commento", "moltiplicatore", "riga-accordi", "riga-testo", "strumentale", "tonalita", "voce",
#           "stanza", "struttura-stanza", "canto-singolo", "struttura-canto"]
# test = ["accordo", "commento", "moltiplicatore", "riga-accordi", "riga-testo", "strumentale", "tonalita", "voce",
#           "strofa", "ritornello", "pre-chorus", "bridge", "struttura-stanza", "canto", "struttura-canto"]
# test_file = test[13]

# filename = test_file + ".json"
# # dir = os.path.join(CANTI_DIR, Path(filename).stem).replace("\\","/")
# dir = os.path.join(CANTI_DIR, "Test").replace("\\","/")
# filepath = os.path.join(dir, filename).replace("\\","/")

# validation = Validation()
# validate = validation.validate(filepath)
# print(validate["is_valid"])

