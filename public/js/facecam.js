let modelLoaded = false
let minFaceSize = 200
let maxDistance = 0.6
let minConfidence = 0.9
let forwardTimes = []
let recorder = null
var unknownCont = 0;

function onIncreaseMinFaceSize() {
    minFaceSize = Math.min(faceapi.round(minFaceSize + 50), 300)
    $('#minFaceSize').val(minFaceSize)
}

function onDecreaseMinFaceSize() {
    minFaceSize = Math.max(faceapi.round(minFaceSize - 50), 50)
    $('#minFaceSize').val(minFaceSize)
}

function updateTimeStats(timeInMs) {
    forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
    const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length
    $('#time').val(`${Math.round(avgTimeInMs)} ms`)
    $('#fps').val(`${faceapi.round(1000 / avgTimeInMs)}`)
}

async function onPlay(videoEl) {
    if (videoEl.paused || videoEl.ended || !modelLoaded)
        return false

    const { width, height } = faceapi.getMediaDimensions(videoEl)
    const canvas = $('#overlay').get(0)
    canvas.width = width
    canvas.height = height

    const mtcnnParams = { minFaceSize }

    const ts = Date.now()
    const fullFaceDescriptions = (await faceapi.allFacesMtcnn(videoEl, mtcnnParams))
        .map(fd => fd.forSize(width, height))
    updateTimeStats(Date.now() - ts)


    fullFaceDescriptions.forEach(({
        detection,
        landmarks,
        descriptor
    }) => {
        const bestMatch = getBestMatch(trainDescriptorsByClass, descriptor)
        const text = `${bestMatch.distance < maxDistance ? bestMatch.className : 'unknown'} (${bestMatch.distance})`

        console.log(text.substr(0, text.indexOf(' ')))

        if (text.substr(0, text.indexOf(' ')) == 'unknown') {
            unknownCont++
            console.log(unknownCont)
            if (unknownCont % 4 == 0) {
                iziToast.error({
                    title: 'Errore',
                    message: text.substr(0, text.indexOf(' ')),
                });
                console.log("DWdwadwaWDwaDwaDW")
                let recorder = RecordRTC(videoEl.srcObject, {
                    type: 'video',
                    //mimeType: 'video/mp4'
                });
                recorder.startRecording();
                setTimeout(function() {
                    recorder.stopRecording(function() {
                        let blob = recorder.getBlob();
                        //invokeSaveAsDialog(blob);
                        shoot(videoEl, blob);

                    });
                }, 20000);
            }
        } else {
            unknownCont = 0
            iziToast.success({
                title: 'Success',
                message: text.substr(0, text.indexOf(' ')),
                timeout: 750
            });
        }
        const {
            x,
            y,
            height: boxHeight
        } = detection.getBox()
            // faceapi.drawText(canvas.getContext('2d'), x, y + boxHeight, text,
            //     Object.assign(faceapi.getDefaultDrawOptions(), {
            //         color: 'red',
            //         fontSize: 16
            //     })
            // )
    })

    setTimeout(() => onPlay(videoEl))
}

async function run() {
    await faceapi.loadMtcnnModel('/')
    await faceapi.loadFaceRecognitionModel('/')

    // init reference data, e.g. compute a face descriptor for each class
    trainDescriptorsByClass = await initTrainDescriptorsByClass(faceapi.recognitionNet)

    modelLoaded = true

    // try to access users webcam and stream the images
    // to the video element
    const videoEl = $('#inputVideo').get(0)
    navigator.getUserMedia({
            video: true,
            audio: true,
        },
        stream => videoEl.srcObject = stream,
        err => console.error(err)
    );

    $('#loader').hide()
}
$(document).ready(function() {
    run()
})

$(window).resize(larg);

function larg() {
    var { width, height } = faceapi.getMediaDimensions($('#inputVideo').get(0))

    const inputVideo = document.getElementById("inputVideo")
    var canvas = $('#overlay').get(0)
    canvas.width = getComputedStyle(inputVideo).width
    canvas.height = getComputedStyle(inputVideo).height

}

function settings() {
    Swal.fire({
        title: 'Min Face Size',
        input: 'select',
        inputOptions: {
            200: '200',
            150: '150',
            100: '100',
            50: '50'
        },
        showCancelButton: true,
        inputValidator: (value) => {
            return new Promise((resolve) => {
                minFaceSize = value
            })
        }
    })
}