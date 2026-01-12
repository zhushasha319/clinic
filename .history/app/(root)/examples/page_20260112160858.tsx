import { DepartmentCard} from "@/components/molecules/specialty-card";

const example={
  title:'aaa'
  icon:'heart'
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
