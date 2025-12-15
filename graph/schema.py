"""
Knowledge Graph Schema for Nexus

Flexible schema supporting any domain with minimal constraints.
The LLM has freedom to generate appropriate relationship types.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

# ============================================================================
# ENTITY TYPES
# ============================================================================

class Organization(BaseModel):
    """Companies, universities, governments, NGOs, research labs, etc."""
    name: str = Field(..., description="Official name of the organization")
    description: Optional[str] = Field(None, description="What this organization does")
    org_type: Optional[str] = Field(None, description="Type: Company, University, Government, NGO, Lab, etc.")
    industry: Optional[str] = Field(None, description="Primary industry or sector")
    location: Optional[str] = Field(None, description="Headquarters location")

class Person(BaseModel):
    """Individuals: executives, researchers, politicians, artists, etc."""
    name: str = Field(..., description="Full name of the person")
    description: Optional[str] = Field(None, description="Brief bio or notable achievement")
    role: Optional[str] = Field(None, description="Current or notable role/title")
    affiliation: Optional[str] = Field(None, description="Primary organization they're associated with")

class Concept(BaseModel):
    """Abstract ideas, topics, technologies, or fields of study."""
    name: str = Field(..., description="Name of the concept or topic")
    description: Optional[str] = Field(None, description="Brief explanation")
    category: Optional[str] = Field(None, description="Category: Technology, Science, Politics, Economics, etc.")

class Location(BaseModel):
    """Geographic entities: countries, cities, regions."""
    name: str = Field(..., description="Name of the location")
    location_type: Optional[str] = Field(None, description="Type: Country, City, Region, etc.")

class Event(BaseModel):
    """Notable occurrences: acquisitions, conferences, discoveries, elections."""
    name: str = Field(..., description="Name or title of the event")
    description: Optional[str] = Field(None, description="What happened")
    date: Optional[str] = Field(None, description="When it occurred (approximate)")

# ============================================================================
# RELATIONSHIPS (Flexible - no strict enum)
# ============================================================================

class Relationship(BaseModel):
    """
    A directed connection between two entities.
    
    Common relationship types include:
    - FOUNDED, LEADS, WORKS_AT, MEMBER_OF, BOARD_MEMBER_OF
    - INVESTED_IN, ACQUIRED, PARTNERED_WITH, COMPETES_WITH
    - RESEARCHES, PUBLISHED, COLLABORATED_WITH
    - RELATED_TO, DEVELOPED, INVENTED
    - LOCATED_IN, HEADQUARTERED_IN
    
    But any descriptive relationship type is valid.
    """
    source: str = Field(..., description="Name of the source entity")
    target: str = Field(..., description="Name of the target entity")
    type: str = Field(..., description="The relationship type (e.g., WORKS_AT, FOUNDED, INVESTED_IN)")
    evidence: Optional[str] = Field(None, description="Brief quote or context supporting this relationship")

# ============================================================================
# EXTRACTION CONTAINER
# ============================================================================

class GraphExtraction(BaseModel):
    """Container for all extracted knowledge graph data."""
    organizations: List[Organization] = Field(default_factory=list, description="List of organizations found")
    people: List[Person] = Field(default_factory=list, description="List of people found")
    concepts: List[Concept] = Field(default_factory=list, description="List of concepts/topics found")
    locations: List[Location] = Field(default_factory=list, description="List of locations found")
    events: List[Event] = Field(default_factory=list, description="List of events found")
    relationships: List[Relationship] = Field(default_factory=list, description="List of relationships between entities")
    
    @property
    def total_entities(self) -> int:
        return (len(self.organizations) + len(self.people) + 
                len(self.concepts) + len(self.locations) + len(self.events))
    
    @property
    def summary(self) -> str:
        return (f"{len(self.organizations)} orgs, {len(self.people)} people, "
                f"{len(self.concepts)} concepts, {len(self.relationships)} relationships")
