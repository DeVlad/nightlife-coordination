var imagePlaceholders = document.getElementsByClassName('img-placeholder');

function fetchPicture(url, placeholderId) {
    $.post(url, function (response) {
        var imgTag = '<img src="' + response.url + '" class="img-responsive" />';
        $(placeholderId).append(imgTag);
    }, 'json');
}

for (var placeholder of imagePlaceholders) {
    var pictureId = placeholder.id.slice(4);
    var url = window.location.origin + '/venue/picture/' + pictureId;
    var placeholderId = '#pid-' + pictureId;
    fetchPicture(url, placeholderId);
}
