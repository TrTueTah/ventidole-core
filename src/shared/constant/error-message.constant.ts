import { ErrorCode } from '@shared/enum/error-code.enum';

const ErrorMessage: Record<
  ErrorCode,
  string | ((...param: unknown[]) => string)
> = {
  [ErrorCode.Unauthenticated]: 'User is not authenticated.',
  [ErrorCode.Unauthorized]: 'User is not authorized.',
  [ErrorCode.ValidationFailed]: 'Validation failed.',
  [ErrorCode.HttpError]: 'Http request error',
  [ErrorCode.UnknownError]: 'An unknown error occurred.',
  [ErrorCode.TokenExpired]: 'Token has expired.',
  [ErrorCode.InvalidToken]: 'Token is invalid.',
  [ErrorCode.NotAnyRecipient]: 'There is no recipient to send email.',
  [ErrorCode.SendMailFailed]: 'Failed to send email.',
  [ErrorCode.ConsumerNotFound]: 'Consumer not found.',
  [ErrorCode.ConsumerFailed]: 'Consumer process failed.',
  [ErrorCode.ProcessFailed]: 'Process failed.',
  [ErrorCode.OtpAlreadyExist]: 'OTP already exists.',
  [ErrorCode.OtpSpam]: 'OTP request is too frequent. Please try again later.',
  [ErrorCode.OtpExpired]: 'OTP has expired.',
  [ErrorCode.OtpIncorrect]: 'OTP is incorrect.',
  [ErrorCode.InvalidDecodeToken]: 'Decoded token is invalid.',
  [ErrorCode.InvalidTokenIssuer]: 'Token issuer is invalid.',
  [ErrorCode.VerificationNotFound]: 'Verification not found.',
  [ErrorCode.VerificationSessionExpired]: 'Verification session has expired.',
  [ErrorCode.AccountNotFound]: 'Account not found.',
  [ErrorCode.ExistedEmail]: 'Email already exists.',
  [ErrorCode.ExistedPhoneNumber]: 'Phone number already exists.',
  [ErrorCode.InvalidEmailOrPassword]: 'Email or password is incorrect.',
  [ErrorCode.InvalidTokenSecret]: 'Token secret is invalid.',
  [ErrorCode.FileNotFound]: 'File not found.',
  [ErrorCode.FileTooLarge]: 'File is too large.',
  [ErrorCode.InvalidFileType]: 'Invalid file type.',
  [ErrorCode.InvalidFileName]: 'Invalid file name.',
  [ErrorCode.EmailAlreadyExists]: 'Email already exists.',
  [ErrorCode.UsernameAlreadyExists]: 'Username already exists.',
  [ErrorCode.ExistedUsername]: 'Username already exists.',
  [ErrorCode.FanProfileNotFound]: 'Fan profile not found.',
  [ErrorCode.IdolProfileNotFound]: 'Idol profile not found.',
  [ErrorCode.ChatChannelNotFound]: 'Chat channel not found.',
  [ErrorCode.NotChannelParticipant]:
    'You are not a participant of this channel.',
  [ErrorCode.NotChannelAdmin]: 'You are not an admin of this channel.',
  [ErrorCode.CannotSendToAnnouncementChannel]:
    'Cannot send messages to announcement channel.',
  [ErrorCode.InternalServerError]: 'Internal server error.',
  [ErrorCode.IdolNotFound]: 'Idol not found.',
  [ErrorCode.PostNotFound]: 'Post not found.',
  [ErrorCode.PostNotOwned]: 'You do not have permission to modify this post.',
  [ErrorCode.CommentNotFound]: 'Comment not found.',
  [ErrorCode.CommentNotOwned]:
    'You do not have permission to modify this comment.',
  [ErrorCode.CommentNotBelongToPost]: 'Comment does not belong to this post.',
  [ErrorCode.CommunityNotFound]: 'Community not found.',
  [ErrorCode.AlreadyJoinedCommunity]: 'You have already joined this community.',
  [ErrorCode.NotJoinedCommunity]: 'You have not joined this community.',
  // Order & Payment
  [ErrorCode.OrderNotFound]: 'Order not found.',
  [ErrorCode.OrderAccessDenied]:
    'You do not have permission to access this order.',
  [ErrorCode.OrderInvalidStatus]: 'Order status is invalid for this operation.',
  [ErrorCode.OrderCannotRetryPayment]:
    'Only PENDING_PAYMENT orders with CREDIT payment method can retry payment.',
  [ErrorCode.OrderAlreadyPaid]: 'Order already has a successful payment.',
  [ErrorCode.OrderItemsEmpty]: 'Order must contain at least one valid item.',
  [ErrorCode.OrderProductInvalid]: 'Some products are invalid or unavailable.',
  [ErrorCode.OrderProductUnavailable]: (productId: string) =>
    `Product ${productId} not found.`,
  [ErrorCode.OrderVariantNotFound]: (variantId: string) =>
    `Variant ${variantId} not found.`,
  [ErrorCode.OrderInsufficientStock]: (name: string) =>
    `Insufficient stock for ${name}.`,
  [ErrorCode.PaymentTransactionNotFound]: (orderCode: number) =>
    `Payment transaction with orderCode ${orderCode} not found.`,
  [ErrorCode.PaymentTransactionCreateFailed]:
    'Failed to create payment transaction.',
  [ErrorCode.PaymentWebhookSignatureInvalid]: 'Invalid webhook signature.',
};

export function getErrorMessage(code: ErrorCode, ...param: unknown[]): string {
  const message = ErrorMessage[code];
  return typeof message === 'function' ? message(...param) : message;
}
