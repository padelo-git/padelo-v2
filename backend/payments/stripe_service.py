import stripe
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class StripeService:
    """Service for handling Stripe payments"""
    
    def __init__(self, api_key: str):
        stripe.api_key = api_key
    
    async def create_payment_intent(
        self,
        amount: int,
        currency: str = "usd",
        user_id: int = None,
        match_id: int = None,
        description: str = None
    ) -> dict:
        """Create a payment intent for a match"""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,  # Amount in cents
                currency=currency,
                metadata={
                    "user_id": str(user_id) if user_id else None,
                    "match_id": str(match_id) if match_id else None,
                    "description": description or "Match payment"
                },
                automatic_payment_methods={
                    "enabled": True
                }
            )
            
            return {
                "success": True,
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": amount,
                "currency": currency
            }
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def confirm_payment(
        self,
        payment_intent_id: str
    ) -> dict:
        """Confirm a payment has been completed"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                "success": True,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency
            }
        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_period_days: Optional[int] = None
    ) -> dict:
        """Create a subscription for a club"""
        try:
            subscription_data = {
                "customer": customer_id,
                "items": [{"price": price_id}],
                "payment_behavior": "default_incomplete",
                "payment_settings": {"save_default_payment_method": "on_subscription"},
                "expand": ["latest_invoice.payment_intent"]
            }
            
            if trial_period_days:
                subscription_data["trial_period_days"] = trial_period_days
            
            subscription = stripe.Subscription.create(**subscription_data)
            
            return {
                "success": True,
                "subscription_id": subscription.id,
                "status": subscription.status,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret
            }
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def cancel_subscription(
        self,
        subscription_id: str
    ) -> dict:
        """Cancel a club subscription"""
        try:
            subscription = stripe.Subscription.delete(subscription_id)
            
            return {
                "success": True,
                "subscription_id": subscription.id,
                "status": subscription.status
            }
        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_customer(
        self,
        email: str,
        name: str = None,
        metadata: dict = None
    ) -> dict:
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            
            return {
                "success": True,
                "customer_id": customer.id,
                "email": customer.email
            }
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def calculate_transaction_fee(
        self,
        amount: int,
        fee_percentage: float = 0.05
    ) -> int:
        """Calculate transaction fee (5% by default)"""
        fee = int(amount * fee_percentage)
        return fee
    
    async def process_match_payment(
        self,
        user_id: int,
        match_id: int,
        amount: int,
        currency: str = "usd"
    ) -> dict:
        """Process payment for a match including transaction fee"""
        # Calculate transaction fee (5%)
        transaction_fee = await self.calculate_transaction_fee(amount)
        net_amount = amount - transaction_fee
        
        # Create payment intent
        payment_result = await self.create_payment_intent(
            amount=amount,
            currency=currency,
            user_id=user_id,
            match_id=match_id,
            description=f"Match payment - Match #{match_id}"
        )
        
        if not payment_result["success"]:
            return payment_result
        
        return {
            "success": True,
            "client_secret": payment_result["client_secret"],
            "payment_intent_id": payment_result["payment_intent_id"],
            "amount": amount,
            "transaction_fee": transaction_fee,
            "net_amount": net_amount,
            "currency": currency
        }


# Global Stripe service instance
stripe_service: Optional[StripeService] = None


def initialize_stripe(api_key: str):
    """Initialize the Stripe service"""
    global stripe_service
    stripe_service = StripeService(api_key)
    logger.info("Stripe service initialized")


def get_stripe_service() -> Optional[StripeService]:
    """Get the Stripe service instance"""
    return stripe_service
