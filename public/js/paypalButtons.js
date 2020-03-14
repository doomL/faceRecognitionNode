// Render the PayPal button
paypal.Button.render({
    // Set your environment
    env: 'sandbox', // sandbox | production

    // Specify the style of the button
    style: {
        layout: 'vertical', // horizontal | vertical
        size: 'responsive', // medium | large | responsive
        shape: 'rect', // pill | rect
        color: 'gold' // gold | blue | silver | white | black
    },

    // Specify allowed and disallowed funding sources
    //
    // Options:
    // - paypal.FUNDING.CARD
    // - paypal.FUNDING.CREDIT
    // - paypal.FUNDING.ELV
    funding: {
        allowed: [
            paypal.FUNDING.CARD,
            paypal.FUNDING.CREDIT
        ],
        disallowed: []
    },

    // Enable Pay Now checkout flow (optional)
    commit: true,

    // PayPal Client IDs - replace with your own
    // Create a PayPal app: https://developer.paypal.com/developer/applications/create
    client: {
        sandbox: 'ARduz3kirhi_-rw8i_60MNgZhwEkU9l43q4Bo252B0rB3tV1WSQ89EKkvHUue23bmGv-GDwg3EtX8hV4',
        production: 'ARduz3kirhi_-rw8i_60MNgZhwEkU9l43q4Bo252B0rB3tV1WSQ89EKkvHUue23bmGv-GDwg3EtX8hV4'
    },

    payment: function(data, actions) {
        return actions.payment.create({
            payment: {
                transactions: [{
                    amount: {
                        total: '5',
                        currency: 'EUR'
                    }
                }]
            }
        });
    },

    onAuthorize: function(data, actions) {
        return actions.payment.execute()
            .then(function() {

                $.ajax({
                    url: 'aggiornaAccount',
                    type: 'POST',
                    success: function(result) {
                        Swal.fire(
                            'Premium!',
                            'Account Aggiornato',
                            'success'
                        ).then(function() {
                            window.location.reload()
                        })
                    }
                });
            });
    }
}, '#paypal-button5');