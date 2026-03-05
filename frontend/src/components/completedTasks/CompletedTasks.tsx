import { useEffect, useState } from "react"
import InidividualTask from "../individualTask/IndividualTask"
import type { TaskResponse } from "@/types"
import { taskAPI } from "@/services/api"


const CompletedTasks = ({ refreshKey, onToggle, selectedDate }: { refreshKey: number, onToggle: () => void, selectedDate: string}) => {
    const [taskList, setTaskList] = useState<TaskResponse[]>([])

    const fetchTasks = async () => {
        try {
            const response = await taskAPI.getAll({ due_date: selectedDate, status: true })
            setTaskList(response)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [refreshKey, selectedDate])
    return (
        <div>
            {taskList.map((task) => (
                <InidividualTask key={task.id} task={task} onToggle={onToggle} />
            ))}
        </div>
    )
}


export default CompletedTasks  