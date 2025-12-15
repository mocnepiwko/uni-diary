import { getHomeworks, deleteHomework } from "@/app/actions";

interface HomeworkListProps {
  subject: string;
}

export default async function HomeworkList({ subject }: HomeworkListProps) {
  const homeworks = await getHomeworks(subject);

  if (!homeworks || homeworks.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        Нет домашних заданий по предмету "{subject}".
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {homeworks.map((hw) => (
        <div 
          key={hw._id} 
          className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white flex justify-between items-start"
        >
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Дедлайн: {new Date(hw.deadline).toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            <h3 className="text-lg font-semibold text-gray-800">
              {hw.description}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Добавил: {hw.createdBy}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await deleteHomework(hw._id);
            }}
          >
            <button
              type="submit"
              className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition"
            >
              Удалить
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}