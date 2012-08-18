
$(function () {
    console.log('NE MEMBER: ', NE_MEMBER);
    $('body').bind('fb', _.bind(NE_MEMBER.init_facebook, NE_MEMBER));
})
