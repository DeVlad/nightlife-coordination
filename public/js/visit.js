var userId = '{{user.id}}';
var btnPlaceholders = document.getElementsByClassName('btn-placeholder');

// Get visitors count and ids
function getVisitorCount(url, btnPlaceholderId) {
    var pattern = /venue/g; // For single venue check. TODO: improve
    var path = window.location.pathname;

    $.get(url, function (response) {
        var visitorsCount = 0;
        var venueId = btnPlaceholderId.slice(4);

        if (response.count > 0) {
            visitorsCount = response.count;

            if (pattern.test(path)) { // if  venue details page
                getVisitorNames(response.visitors);
            }
        }

        var btnTag = '<button type="button" class="btn btn-primary" onclick="visitVenue(\'' + venueId + '\', \'' + userId + '\',this)">Going <span id="btn-' + venueId + '" class="badge">' + visitorsCount + '</span></button>';

        $(btnPlaceholderId).append(btnTag);

    }, 'json');
}

for (var btnPlaceholder of btnPlaceholders) {
    var btnId = btnPlaceholder.id.slice(3);
    var link = window.location.origin + '/venue/' + btnId + '/visitors';
    var btnPlaceholderId = '#ph-' + btnId;

    getVisitorCount(link, btnPlaceholderId);

}

// invoked onclick going button
function visitVenue(venueId, uid, button) {
    var url = window.location.origin + '/venue/' + venueId + '/visitors';

    $.post(url, function (response) {        
        var id = '#btn-' + response.vid;
        var visitorsCount = response.count | 0;

        $(id).text(visitorsCount);

    }, 'json');
}

function getVisitorNames(visitors) {
    var visitorsPlaceholderId = "#visitors-list";

    visitors.forEach(function (visitor) {
        var visitorUrl = window.location.origin + '/user/' + visitor;

        $.get(visitorUrl, function (response) {
            if (response && response.username !== false) {
                var output = response.username + ', ';

                $(visitorsPlaceholderId).append(output);

            } else {
                console.log('Error fetching username');
            }

        }, 'json');
    });
}
