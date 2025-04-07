function calculateMentorScores(student, score, allStudents) {
    const scoreChanges = [{ studentId: student.id, scoreChange: score }];
    let currentStudent = student;
    let level = 0;

    // 最多追溯两级师傅
    while (currentStudent.mentorId && level < 2) {
        const mentor = allStudents.find(s => s.id === currentStudent.mentorId);
        if (mentor) {
            // 师傅获得徒弟分数的一半
            const mentorScore = score * 0.5;
            scoreChanges.push({
                studentId: mentor.id,
                scoreChange: mentorScore
            });
            currentStudent = mentor;
            level++;
        } else {
            break;
        }
    }

    return scoreChanges;
}

function updateGroupScores(groups, studentId, scoreChanges) {
    return groups.map(group => {
        const updatedStudents = group.students.map(student => {
            const change = scoreChanges.find(sc => sc.studentId === student.id);
            if (change) {
                return {
                    ...student,
                    score: student.score + change.scoreChange
                };
            }
            return student;
        });

        // 更新小组的总分和剩余积分
        const totalScoreChange = updatedStudents.reduce((sum, student) => {
            const originalStudent = group.students.find(s => s.id === student.id);
            return sum + (student.score - (originalStudent?.score || 0));
        }, 0);

        return {
            ...group,
            students: updatedStudents,
            totalScore: group.totalScore + totalScoreChange,
            remainingScore: group.remainingScore + totalScoreChange
        };
    });
} 