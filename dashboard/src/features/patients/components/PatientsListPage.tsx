import { Link } from "@tanstack/react-router"
import Header from "@/components/common/Header"

export default function PatientsListPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Header title="Patients" />
      <Link to="/patients/$patientId" params={{ patientId: "123" }}>
        Patient 123
      </Link>
    </div>
  )
}
