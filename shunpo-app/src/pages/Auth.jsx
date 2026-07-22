import { AuthForm } from '../components/AuthForm'

export default function Auth() {
  return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <AuthForm />
        </div>
      </div>
    )
}
