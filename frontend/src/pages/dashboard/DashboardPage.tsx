// // import DashboardLayout from '../../components/DashBoardLayout';
// // import TaskInput from '@/components/taskinput/TaskInput';
// // import './DashboardPage.css'
// // import ActiveTasks from '@/components/activeTasks/ActiveTasks';
// // import CompletedTasks from '@/components/completedTasks/CompletedTasks';
// // import { useState } from 'react';

// // const DashboardPage = () => {
// //     const [refreshKey, setRefreshKey] = useState<number>(0)
// //     const [selectedDate, setSelectedDate] = useState<string>(
// //         new Date().toLocaleDateString('en-CA')
// //     )

// //     const handleTaskCreated = () => {
// //         setRefreshKey( prev => prev + 1)
// //     }

// //     const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //         setSelectedDate(e.target.value)
// //         setRefreshKey(prev => prev + 1)
// //     }

// //     const handlePrevDay = () => {
// //         const [year, month, day] = selectedDate.split('-').map(Number)
// //         const date = new Date(year, month - 1, day)  // month is 0-indexed
// //         date.setDate(date.getDate() - 1)
// //         setSelectedDate(date.toLocaleDateString('en-CA'))
// //         setRefreshKey(prev => prev + 1)
// //     }

// //     const handleNextDay = () => {
// //         const [year, month, day] = selectedDate.split('-').map(Number)
// //         const date = new Date(year, month - 1, day)
// //         date.setDate(date.getDate() + 1)
// //         setSelectedDate(date.toLocaleDateString('en-CA'))
// //         setRefreshKey(prev => prev + 1)
// //     }
    
// //     return (
// //         <DashboardLayout>
// //             <div>
// //                 <h1>
// //                     Today
// //                 </h1>
// //                 <div className="date-nav">
// //                     <button onClick={handlePrevDay}>←</button>
// //                     <input
// //                         type="date"
// //                         value={selectedDate}
// //                         onChange={handleDateChange}
// //                     />
// //                     <button onClick={handleNextDay}>→</button>
// //                 </div>
// //                 <div>
// //                     <TaskInput onTaskCreated={handleTaskCreated}/>
// //                     <div className='panes'>
// //                         <div className='activePane'>
// //                             <h1>Active tasks</h1>
// //                             <ActiveTasks refreshKey={refreshKey} onToggle={handleTaskCreated} selectedDate={selectedDate} />
// //                         </div>
// //                         <div className='completedPane'>
// //                             <h1>completed tasks</h1>
// //                             <CompletedTasks refreshKey={refreshKey} onToggle={handleTaskCreated} selectedDate={selectedDate} />
// //                         </div>                        
// //                     </div>

// //                 </div>
// //             </div>
// //         </DashboardLayout>
// //     );
// // };

// // export default DashboardPage;



// import DashboardLayout from '../../components/DashBoardLayout';
// import TaskInput from '@/components/taskinput/TaskInput';
// import './DashboardPage.css'
// import ActiveTasks from '@/components/activeTasks/ActiveTasks';
// import CompletedTasks from '@/components/completedTasks/CompletedTasks';
// import { useState } from 'react';

// const DashboardPage = () => {
//     const [refreshKey, setRefreshKey] = useState<number>(0)
//     const [selectedDate, setSelectedDate] = useState<string>(
//         new Date().toLocaleDateString('en-CA')
//     )
//     const [showTaskInput, setShowTaskInput] = useState(false) // Added

//     const handleTaskCreated = () => {
//         setRefreshKey(prev => prev + 1)
//         setShowTaskInput(false) // Close modal after task created
//     }

//     const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setSelectedDate(e.target.value)
//         setRefreshKey(prev => prev + 1)
//     }

//     const handlePrevDay = () => {
//         const [year, month, day] = selectedDate.split('-').map(Number)
//         const date = new Date(year, month - 1, day)
//         date.setDate(date.getDate() - 1)
//         setSelectedDate(date.toLocaleDateString('en-CA'))
//         setRefreshKey(prev => prev + 1)
//     }

//     const handleNextDay = () => {
//         const [year, month, day] = selectedDate.split('-').map(Number)
//         const date = new Date(year, month - 1, day)
//         date.setDate(date.getDate() + 1)
//         setSelectedDate(date.toLocaleDateString('en-CA'))
//         setRefreshKey(prev => prev + 1)
//     }

//     return (
//         <DashboardLayout>
//             <div>
//                 <h1>Today</h1>

//                 <div className="date-nav">
//                     <button onClick={handlePrevDay}>←</button>
//                     <input
//                         type="date"
//                         value={selectedDate}
//                         onChange={handleDateChange}
//                     />
//                     <button onClick={handleNextDay}>→</button>
//                     <button onClick={() => setShowTaskInput(true)}>Add Task</button> {/* Added */}
//                 </div>

//                 {/* Show modal when button clicked */}
//                 {showTaskInput && (
//                     <TaskInput
//                         onTaskCreated={handleTaskCreated}
//                         onCancel={() => setShowTaskInput(false)} // Added
//                     />
//                 )}

//                 <div className='panes'>
//                     <div className='activePane'>
//                         <h1>Active tasks</h1>
//                         <ActiveTasks
//                             refreshKey={refreshKey}
//                             onToggle={handleTaskCreated}
//                             selectedDate={selectedDate}
//                         />
//                     </div>
//                     <div className='completedPane'>
//                         <h1>Completed tasks</h1>
//                         <CompletedTasks
//                             refreshKey={refreshKey}
//                             onToggle={handleTaskCreated}
//                             selectedDate={selectedDate}
//                         />
//                     </div>
//                 </div>
//             </div>
//         </DashboardLayout>
//     );
// };

// export default DashboardPage;


import DashboardLayout from '../../components/DashBoardLayout';
import TaskInput from '@/components/taskinput/TaskInput';
import './DashboardPage.css'
import ActiveTasks from '@/components/activeTasks/ActiveTasks';
import CompletedTasks from '@/components/completedTasks/CompletedTasks';
import { useState, useEffect } from 'react';
import { productivityAPI } from '@/services/api';

const DashboardPage = () => {
    const [refreshKey, setRefreshKey] = useState<number>(0)
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toLocaleDateString('en-CA')
    )
    const [showTaskInput, setShowTaskInput] = useState(false)
    const [completionPercentage, setCompletionPercentage] = useState(0)

    useEffect(() => {
        fetchProductivity();
    }, [selectedDate, refreshKey]);

    const fetchProductivity = async () => {
        try {
            const data = await productivityAPI.getDaily(selectedDate);
            setCompletionPercentage(data.completion_percentage);
        } catch (err) {
            console.error('Failed to fetch productivity:', err);
        }
    };

    const handleTaskCreated = () => {
        setRefreshKey(prev => prev + 1)
        setShowTaskInput(false)
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value)
        setRefreshKey(prev => prev + 1)
    }

    const handlePrevDay = () => {
        const [year, month, day] = selectedDate.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        date.setDate(date.getDate() - 1)
        setSelectedDate(date.toLocaleDateString('en-CA'))
        setRefreshKey(prev => prev + 1)
    }

    const handleNextDay = () => {
        const [year, month, day] = selectedDate.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        date.setDate(date.getDate() + 1)
        setSelectedDate(date.toLocaleDateString('en-CA'))
        setRefreshKey(prev => prev + 1)
    }

    return (
        <DashboardLayout>
            <div className="dashboard-today">
                {/* Header */}
                <div className="dashboard-header">
                    <h1>Today</h1>

                    <div className="date-nav">
                        <button onClick={handlePrevDay} aria-label="Previous day">←</button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                        <button onClick={handleNextDay} aria-label="Next day">→</button>
                    </div>

                    <button onClick={() => setShowTaskInput(true)} className="btn-add-task">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Task
                    </button>
                </div>

                {/* Task Input Modal */}
                {showTaskInput && (
                    <TaskInput
                        onTaskCreated={handleTaskCreated}
                        onCancel={() => setShowTaskInput(false)}
                    />
                )}

                {/* Two Panes */}
                <div className='panes'>
                    <div className='activePane'>
                        <h1>Active Tasks</h1>
                        <div className="task-list-container">
                            <ActiveTasks
                                refreshKey={refreshKey}
                                onToggle={handleTaskCreated}
                                selectedDate={selectedDate}
                            />
                        </div>
                    </div>

                    <div className='completedPane'>
                        <h1>Completed Tasks</h1>
                        <div className="task-list-container">
                            <CompletedTasks
                                refreshKey={refreshKey}
                                onToggle={handleTaskCreated}
                                selectedDate={selectedDate}
                            />
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="progress-section">
                    <div className="progress-header">
                        <span className="progress-label">Today's Progress</span>
                        <span className="progress-percentage">{completionPercentage}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DashboardPage;