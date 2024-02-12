import { CommandType } from "./commandTypes";

export const commands: {[key: string]: string} = {
  [CommandType.Create]: "создать группу",
  [CommandType.Join]: "присоединиться к группе",
  [CommandType.Leave]: "покинуть группу",
  [CommandType.List]: "список групп"
}
