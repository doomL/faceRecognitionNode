const classes = ['matteo', 'domenico']
var snapshots = [];

function getImageUri(imageName) {
    return `images/faces/${imageName}`
}

function getFaceImageUri(className, idx) {
    return `images/faces/${className}/${className}${idx}.jpg`
}

async function fetchImage(uri) {
    return (await fetch(uri)).blob()
}

async function requestExternalImage(imageUrl) {
    const res = await fetch('fetch_external_image', {
        method: 'post',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
    })
    if (!(res.status < 400)) {
        console.error(res.status + ' : ' + await res.text())
        throw new Error('failed to fetch image from url: ' + imageUrl)
    }

    let blob
    try {
        blob = await res.blob()
        return await faceapi.bufferToImage(blob)
    } catch (e) {
        console.error('received blob:', blob)
        console.error('error:', e)
        throw new Error('failed to load image from url: ' + imageUrl)
    }
}

// fetch first image of each class and compute their descriptors
async function initTrainDescriptorsByClass(net, numImagesForTraining = 1) {
    const maxAvailableImagesPerClass = 5
    numImagesForTraining = Math.min(numImagesForTraining, maxAvailableImagesPerClass)
    return Promise.all(classes.map(
        async className => {
            const descriptors = []
            for (let i = 1; i < (numImagesForTraining + 1); i++) {
                const img = await faceapi.bufferToImage(
                    await fetchImage(getFaceImageUri(className, i))
                )
                descriptors.push(await net.computeFaceDescriptor(img))
            }
            return {
                descriptors,
                className
            }
        }
    ))
}

function getBestMatch(descriptorsByClass, queryDescriptor) {
    function computeMeanDistance(descriptorsOfClass) {
        return faceapi.round(
            descriptorsOfClass
            .map(d => faceapi.euclideanDistance(d, queryDescriptor))
            .reduce((d1, d2) => d1 + d2, 0) /
            (descriptorsOfClass.length || 1)
        )
    }
    return descriptorsByClass
        .map(
            ({ descriptors, className }) => ({
                distance: computeMeanDistance(descriptors),
                className
            })
        )
        .reduce((best, curr) => best.distance < curr.distance ? best : curr)
}

function renderSelectList(selectListId, onChange, initialValue, renderChildren) {
    const select = document.createElement('select')
    $(selectListId).get(0).appendChild(select)
    renderChildren(select)
    $(select).val(initialValue)
    $(select).on('change', (e) => onChange(e.target.value))
    $(select).material_select()
}

function renderOption(parent, text, value) {
    const option = document.createElement('option')
    option.innerHTML = text
    option.value = value
    parent.appendChild(option)
}

function renderFaceImageSelectList(selectListId, onChange, initialValue) {
    const indices = [1, 2, 3, 4, 5]

    function renderChildren(select) {
        classes.forEach(className => {
            const optgroup = document.createElement('optgroup')
            optgroup.label = className
            select.appendChild(optgroup)
            indices.forEach(imageIdx =>
                renderOption(
                    optgroup,
                    `${className} ${imageIdx}`,
                    getFaceImageUri(className, imageIdx)
                )
            )
        })
    }

    renderSelectList(
        selectListId,
        onChange,
        getFaceImageUri(initialValue.className, initialValue.imageIdx),
        renderChildren
    )
}

function renderImageSelectList(selectListId, onChange, initialValue) {
    const images = [1, 2, 3, 4, 5].map(idx => `bbt${idx}.jpg`)

    function renderChildren(select) {
        images.forEach(imageName =>
            renderOption(
                select,
                imageName,
                getImageUri(imageName)
            )
        )
    }

    renderSelectList(
        selectListId,
        onChange,
        getImageUri(initialValue),
        renderChildren
    )
}

function capture(video, scaleFactor) {
    if (scaleFactor == null) {
        scaleFactor = 1;
    }
    var w = video.videoWidth * scaleFactor;
    var h = video.videoHeight * scaleFactor;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return canvas;
}

/**
 * Invokes the <code>capture</code> function and attaches the canvas element to the DOM.
 */
async function shoot(video, blob) {

    $('<canvas>').attr({
        id: "canvas"
    }).appendTo('#output');

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    var canvasData = canvas.toDataURL('image/png')
    var png = canvasData.split(',')[1];
    var blobCanv = base64toBlob(png)

    var formData = new FormData();
    await formData.append('video-blob', blob);
    await formData.append('canvas', blobCanv);

    $.ajax({
        url: "/intruder",
        data: formData,
        method: "POST",
        processData: false,
        contentType: false

    });

    // for (var i = 0; i < 4; i++) {
    //     output.appendChild(snapshots[i]);
    // }
}

function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}