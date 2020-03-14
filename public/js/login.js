$(document).ready(function() {

    var animating = false,
        submitPhase1 = 1100,
        submitPhase2 = 400,
        logoutPhase1 = 800,
        $login = $(".login"),
        $app = $(".app");

    function ripple(elem, e) {
        $(".ripple").remove();
        var elTop = elem.offset().top,
            elLeft = elem.offset().left,
            x = e.pageX - elLeft,
            y = e.pageY - elTop;
        var $ripple = $("<div class='ripple'></div>");
        $ripple.css({ top: y, left: x });
        elem.append($ripple);
    };

    $(document).on("click", "#login", function(e) {
        var name = $('#name').val()
        var pass = $('#pass').val()
        if (animating) return;
        animating = true;
        var that = this;
        ripple($(that), e);
        /*$(that).addClass("processing");
        setTimeout(function() {
            $(that).addClass("success");
            setTimeout(function() {
                $app.show();
                $app.css("top");
                $app.addClass("active");
            }, submitPhase2 - 70);
            setTimeout(function() {
                $login.hide();
                $login.addClass("inactive");
                animating = false;
                $(that).removeClass("success processing");
            }, submitPhase2); 
    }, submitPhase1);*/
        console.log(name)
        console.log(pass)
        $.ajax({
            url: '/login1',
            type: 'POST',
            data: { 'name': name, 'pass': md5(pass) },
            success: function(response) {
                window.location.replace("/");
            },
            error: function(response) {
                //json = JSON.parse(response);
                iziToast.error({
                    title: 'Errore',
                    message: 'Username e/o password sbagliati',
                });

            }
        });
    });

    $(document).on("click", "#registration", function(e) {
        var name = $('#name').val()
        var pass = $('#pass').val()
        var email = $('#email').val()

        // if (name || pass || email == null)
        //     window.location.reload()

        if (animating) return;
        animating = true;
        var that = this;
        ripple($(that), e);

        $.ajax({
            url: '/registration',
            type: 'POST',
            data: { 'name': name, 'pass': md5(pass), 'email': email },
            success: function(response) {
                iziToast.success({
                    title: 'OK',
                    message: 'Registrazione Avvenuta Con Successo!',
                    timeout: 2000,
                    onClosed: function() { window.location.replace("/login") }
                });
            },
            error: function(response) {
                //json = JSON.parse(response);
                iziToast.error({
                    title: 'Error',
                    message: 'Illegal operation',
                });
                window.location.replace("/signUp");
            }
        });

    });

    $("#azienda").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#registration").click();
        }
    });


    $("#pass").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#login").click();
        }
    });
    console.log(localStorage.getItem("myValue"))

    localStorage.setItem("myValue", "123-abcd");

    function ValidateEmail(mail) {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
            return (true)
        }
        Swal.fire(
            'Errore',
            "Email non valida",
            'error'
        ).then((result) => {
            return (false)

        })
    }

    $("input").on("keyup", function() {
        if ($("#name").val() != "" && $("#pass").val() != "" && $("#email").val() != "") {
            $(".toggle_disabled").removeAttr("disabled");
        } else {
            $(".toggle_disabled").attr("disabled");
        }
    });
});