from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from core.database import get_db
from core.security import get_current_user
from messaging.models import Message, MessageRead, Conversation
from messaging.schemas import (
    MessageCreate, MessageResponse, MessageWithReads,
    MessageReadCreate, MessageReadResponse,
    ConversationCreate, ConversationUpdate, ConversationResponse
)

router = APIRouter()


# Message endpoints
@router.post("/", response_model=MessageResponse)
async def create_message(
    message: MessageCreate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new message (requires authentication)"""
    db_message = Message(
        club_id=message.club_id,
        sender_id=message.sender_id,
        content=message.content,
        message_type=message.message_type,
        is_announcement=message.is_announcement
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    
    return db_message


@router.get("/", response_model=List[MessageResponse])
async def get_messages(club_id: int, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get all messages for a club"""
    result = await db.execute(
        select(Message)
        .where(Message.club_id == club_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()
    return messages


@router.get("/{message_id}", response_model=MessageWithReads)
async def get_message(message_id: int, db: AsyncSession = Depends(get_db)):
    """Get message by ID with read receipts"""
    result = await db.execute(select(Message).where(Message.id == message_id))
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Get read receipts
    reads_result = await db.execute(
        select(MessageRead).where(MessageRead.message_id == message_id)
    )
    reads = reads_result.scalars().all()
    
    return MessageWithReads(
        **message.__dict__,
        read_receipts=reads
    )


# Message Read endpoints
@router.post("/reads", response_model=MessageReadResponse)
async def mark_message_read(read: MessageReadCreate, db: AsyncSession = Depends(get_db)):
    """Mark a message as read by a user"""
    # Check if already read
    result = await db.execute(
        select(MessageRead)
        .where(MessageRead.message_id == read.message_id)
        .where(MessageRead.user_id == read.user_id)
    )
    existing_read = result.scalar_one_or_none()
    
    if existing_read:
        return existing_read
    
    db_read = MessageRead(
        message_id=read.message_id,
        user_id=read.user_id
    )
    db.add(db_read)
    await db.commit()
    await db.refresh(db_read)
    
    return db_read


# Conversation endpoints
@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(conversation: ConversationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new conversation"""
    db_conversation = Conversation(
        club_id=conversation.club_id,
        user_id=conversation.user_id
    )
    db.add(db_conversation)
    await db.commit()
    await db.refresh(db_conversation)
    
    return db_conversation


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(club_id: int, db: AsyncSession = Depends(get_db)):
    """Get all conversations for a club"""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.club_id == club_id)
        .where(Conversation.is_active == True)
    )
    conversations = result.scalars().all()
    return conversations


@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(conversation_id: int, conversation_update: ConversationUpdate, db: AsyncSession = Depends(get_db)):
    """Update conversation"""
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Update fields
    for field, value in conversation_update.model_dump(exclude_unset=True).items():
        setattr(conversation, field, value)
    
    await db.commit()
    await db.refresh(conversation)
    
    return conversation


# WebSocket endpoint for real-time messaging
@router.websocket("/ws/{club_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, club_id: int, user_id: int):
    """WebSocket endpoint for real-time messaging"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Process message (save to database, broadcast, etc.)
            # This is a placeholder - you would implement the actual logic here
            
            # Send acknowledgment back to client
            await websocket.send_json({
                "type": "message_received",
                "data": data
            })
            
    except WebSocketDisconnect:
        # Handle disconnection
        pass
