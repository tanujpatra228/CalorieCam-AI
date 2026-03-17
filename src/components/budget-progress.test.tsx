import { render, screen } from '@testing-library/react'
import { BudgetProgress } from './budget-progress'

describe('BudgetProgress', () => {
  it('renders label, intake value, and target', () => {
    render(
      <BudgetProgress label="Calories" unit="kcal" intake={1200} target={2000} excessIsBad={true} />
    )
    expect(screen.getByText('Calories')).toBeInTheDocument()
    expect(screen.getByText('1200')).toBeInTheDocument()
    expect(screen.getByText('/2000kcal')).toBeInTheDocument()
  })

  it('renders unit correctly for protein', () => {
    render(
      <BudgetProgress label="Protein" unit="g" intake={80} target={120} excessIsBad={false} />
    )
    expect(screen.getByText('Protein')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('/120g')).toBeInTheDocument()
  })

  it('applies red styling when calories exceed target (excessIsBad=true)', () => {
    const { container } = render(
      <BudgetProgress label="Calories" unit="kcal" intake={2500} target={2000} excessIsBad={true} />
    )
    expect(container.innerHTML).toContain('bg-red-800')
  })

  it('does not apply red styling when calories are under target (excessIsBad=true)', () => {
    const { container } = render(
      <BudgetProgress label="Calories" unit="kcal" intake={1500} target={2000} excessIsBad={true} />
    )
    expect(container.innerHTML).not.toContain('bg-red-800')
  })

  it('applies red styling when protein is under target (excessIsBad=false)', () => {
    const { container } = render(
      <BudgetProgress label="Protein" unit="g" intake={80} target={120} excessIsBad={false} />
    )
    expect(container.innerHTML).toContain('bg-red-800')
  })

  it('does not apply red styling when protein exceeds target (excessIsBad=false)', () => {
    const { container } = render(
      <BudgetProgress label="Protein" unit="g" intake={150} target={120} excessIsBad={false} />
    )
    expect(container.innerHTML).not.toContain('bg-red-800')
  })

  it('handles null target without crashing', () => {
    render(
      <BudgetProgress label="Calories" unit="kcal" intake={500} target={null} excessIsBad={true} />
    )
    expect(screen.getByText('Calories')).toBeInTheDocument()
  })

  it('handles undefined target without crashing', () => {
    render(
      <BudgetProgress label="Protein" unit="g" intake={0} target={undefined} excessIsBad={false} />
    )
    expect(screen.getByText('Protein')).toBeInTheDocument()
  })

  it('handles zero intake', () => {
    render(
      <BudgetProgress label="Calories" unit="kcal" intake={0} target={2000} excessIsBad={true} />
    )
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
