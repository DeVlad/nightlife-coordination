var venueId = window.location.pathname.split("/").pop();
var url = window.location.origin + '/venue/pictures/' + venueId;

function createPictures(pictures) {
    var firstPicture = true;
    for (var picture of pictures) {
        if (firstPicture) {
            var imgTag = '<div class="item active"><a target="_blank" href=' + picture + '><img src="' + picture + '" class="img-responsive carousel-image" /></a></div>';
            $(placeholder).append(imgTag);
            firstPicture = false;
        } else {
            var imgTag = '<div class="item"><a target="_blank" href=' + picture + '><img src="' + picture + '" class="img-responsive carousel-image" /></a></div>';
            $(placeholder).append(imgTag);
        }
    }
}

$.post(url, function (response) {
    createPictures(response.pictures);
}, 'json');
