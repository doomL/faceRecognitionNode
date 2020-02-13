    var width = 150; // We will scale the photo width to this
    var height = 150; // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.

    var streaming = false;
    var overNumber = 0
        // The various HTML elements we need to configure or control. These
        // will be set by the startup() function.

    var video = null;
    var canvas = null;
    var photo = null;
    var startbutton = null;

    function startup() {
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        photo = document.getElementById('photo');
        startbutton = document.getElementById('take-photo');
        var sendPicture = document.getElementById('next');
        var removePicture = document.getElementById('delete')

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();

            })
            .catch(function(err) {
                console.log("An error occurred: " + err);
            });

        video.addEventListener('canplay', function(ev) {
            if (!streaming) {

                //video.setAttribute('width', width);
                //ideo.setAttribute('height', height);
                // canvas.setAttribute('width', width);
                // canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);
        //console.log(stream.width + " " + video.height)
        startbutton.addEventListener('click', function(ev) {
            takepicture();
            ev.preventDefault();
        }, false);
        sendPicture.addEventListener('click', function(ev) {
            sendData();
        }, false);
        removePicture.addEventListener('click', function(ev) {
            removePrevious();
        }, false);

    }

    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.

    function takepicture() {
        overNumber++;
        var elementID = 'canvas' + overNumber;
        $('<canvas>').attr({ id: elementID }).appendTo('.contentarea');

        var canvas = document.getElementById(elementID);
        var ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        if (overNumber >= 5) {
            $("#take-photo").addClass("disabled")
            $("#video").css("opacity", "0.2")
            $("#over").attr("src", " ")
            $("#next").removeClass("disabled")
            $("#next").addClass("blue")
        } else {
            $("#over").attr("src", "/images/overlay/overlay" + (overNumber + 1) + ".png")
        }
        if (overNumber > 0) {
            $("#delete").addClass("red")
            $("#delete").removeClass("disabled")

        }


    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    window.addEventListener('load', startup, false);
    $(document).ready(function() {
        var dimensions = [$("#take-photo").width(), $("#take-photo").height()]
        document.getElementById('video').addEventListener('loadeddata', function() {
            $("#video_overlays").css({ "position": "absolute", "top": "0", "left": "0", "height": $(video)[0].videoHeight, "width": $(video)[0].videoWidth, "z - index": "3", "display": "block", "text-align": "center" });
            $("#over").attr("height", $(video)[0].videoHeight)
            $("#take-photo").css({ "top": $(video)[0].videoHeight - 62, "left": $(video)[0].videoWidth - 62, "display": "flex" });

        }, false);
    })
    $(window).on("orientationchange", function(event) {
        $("#video_overlays").css({ "position": "absolute", "top": "0", "left": "0", "height": $(video)[0].videoHeight, "width": $(video)[0].videoWidth, "z - index": "3", "display": "block", "text-align": "center" });
        $("#over").attr("height", $(video)[0].videoHeight)
        $("#take-photo").css({ "top": $(video)[0].videoHeight - 62, "left": $(video)[0].videoWidth - 62, "display": "flex" });
    });

    function sendData() {
        var images = []
        var i;
        for (i = 1; i <= 5; i++)
            images.push(document.getElementById('canvas' + i).toDataURL('image/png'))
        $.ajax({
            url: "/dataset",
            data: { images: images },
            method: "POST"

        });
        Swal.fire(
            'Successo',
            'La registrazione è andata a buon fine',
            'success'
        ).then((result) => {
            location.reload();

        });
    }

    function removePrevious() {
        console.log("dwadwa")
        console.log(overNumber)
        $('#canvas' + overNumber).remove()
        $("#over").attr("src", "/images/overlay/overlay" + overNumber + ".png")
        overNumber--;

        $("#next").addClass("disabled")
        $("#next").removeClass("blue")
        $("#take-photo").removeClass("disabled")
        $("#video").css("opacity", "1")
        if (overNumber == 0) {
            $("#delete").removeClass("red")
            $("#delete").addClass("disabled")
        }
    }