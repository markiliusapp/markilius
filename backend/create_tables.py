from app.database import engine, Base
from app.models.user import User
from app.models.task import Task
from app.models.arena import Arena

# Create all tables
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")
