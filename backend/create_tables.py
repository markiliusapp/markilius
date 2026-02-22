from app.database import engine, Base
from app.models.user import User
from app.models.task import Task

# Create all tables
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")
