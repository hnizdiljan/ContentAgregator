# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /code

# Install system dependencies required for some Python packages (like lxml or db drivers)
# Example: RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential libpq-dev
# Add dependencies as needed

# Copy the requirements file into the container at /code
COPY ./requirements.txt /code/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r /code/requirements.txt

# Copy the rest of the application code into the container at /code
COPY ./app /code/app

# Make port 80 available to the world outside this container
# The default port for uvicorn
EXPOSE 80

# Define environment variable (optional, can be overridden)
# ENV NAME World

# Run uvicorn server when the container launches
# Use --host 0.0.0.0 to make it accessible from outside the container
# Use --port 80 to match the EXPOSE instruction
# Use --reload for development (consider removing in production)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80", "--reload"] 