export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return <h1>Reset Password (Token: {params.token})</h1>;
}
