import { DepartmentCard} from "@/components/molecules/departmentCard";

const example={
  title:'aaa',
  icon:'Heart'
}


export default function Examples() {
  return(
    <div>
     <DepartmentCard
     title={example.title}
     icon={example.icon}
     ></DepartmentCard>
      </div>
  )
}
