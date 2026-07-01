const reviews = new Map();
export function getReview(prId) {
    return reviews.get(prId) ?? null;
}
export function setReview(review) {
    reviews.set(review.prId, review);
}
export function updateFindingComment(prId, findingId, comment) {
    const review = reviews.get(prId);
    const finding = review?.findings.find((f) => f.id === findingId);
    if (!review || !finding)
        return null;
    if (finding.status === 'posted')
        return null;
    finding.comment = comment;
    finding.postError = undefined;
    return finding;
}
export function markFindingPosted(prId, findingId, postedUrl) {
    const review = reviews.get(prId);
    const finding = review?.findings.find((f) => f.id === findingId);
    if (!review || !finding)
        return null;
    finding.status = 'posted';
    finding.postedUrl = postedUrl;
    finding.postError = undefined;
    return finding;
}
export function markFindingError(prId, findingId, message) {
    const review = reviews.get(prId);
    const finding = review?.findings.find((f) => f.id === findingId);
    if (finding)
        finding.postError = message;
}
