import LCal from "../../calendar/lcal";
import TaskModel from "../taskmodel";
import Task from "../../data/task";

describe("TaskModel", () => {

    it("should add task", () => {
        const task = new Task(1, new LCal(), new LCal(), 1, "", "", null);
        const model = new TaskModel();
        model.add(task);
        expect(model.getAll().length).toBe(1);
    });

    it("should remove task", () => {
        const task = new Task(1, new LCal(), new LCal(), 1, "", "", null);
        const model = new TaskModel();
        model.add(task);
        model.removeByID(1, false);
        expect(model.getAll().length).toBe(0);
    });

    it("should remove deleted task", () => {
        const task = new Task(1, new LCal(), new LCal(), 1, "", "", null);
        const model = new TaskModel();
        model.add(task);
        const task2 = new Task(1, new LCal(), new LCal(), 1, "", "", null);
        task2.setDeleted(true);
        model.put(task2);
        expect(model.getAll().length).toBe(0);
    });

});
