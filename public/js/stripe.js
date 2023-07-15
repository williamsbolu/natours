import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
    const stripe = Stripe(
        'pk_test_51NJgKwFVYlQNIJPL7c63hn4g5KKtpUX7Bfg39JUOSjb1ep1lx7vSeAzR7LWl373wIUnCjy3rPRbyqHlzyBnzQUNT008rxpFqxl'
    );

    try {
        // 1. Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);

        // 2. Create the checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};
