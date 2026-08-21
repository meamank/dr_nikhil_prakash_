export default function Username({
  name,
  userType,
}: {
  name: string
  userType: string
}) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="font-medium">{name}</span>
      <span className="text-xs">{userType}</span>
    </div>
  )
}
