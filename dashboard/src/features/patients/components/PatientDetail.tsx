import Header from "@/components/common/Header"
import { getRouteApi } from "@tanstack/react-router"

const routeApi = getRouteApi("/_authenticated/patients/$patientId")

export default function PatientDetail() {
  const { patientId } = routeApi.useParams()

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Header title={`Welcome, ${patientId}`} />
    </div>
  )
}
